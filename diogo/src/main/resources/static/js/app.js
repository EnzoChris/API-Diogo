const API_URL = '/funcionarios';
const state = { candidates: [] };

const $ = (selector) => document.querySelector(selector);

document.addEventListener('DOMContentLoaded', () => {
    $('#candidate-form').addEventListener('submit', saveCandidate);
    $('#search-form').addEventListener('submit', (event) => { event.preventDefault(); loadCandidates(); });
    $('#new-candidate-button').addEventListener('click', resetForm);
    $('#cancel-edit-button').addEventListener('click', resetForm);
    $('#patch-form').addEventListener('submit', savePatch);
    $('#close-patch-button').addEventListener('click', closePatchModal);
    $('#cancel-patch-button').addEventListener('click', closePatchModal);
    loadDashboard();
});

async function loadDashboard() {
    await Promise.all([loadCandidates(), loadIndicators()]);
}

async function loadCandidates() {
    const name = $('#filter-name').value.trim();
    const cargo = $('#filter-cargo').value.trim();
    const id = $('#filter-id').value.trim();
    const status = $('#filter-status').value;

    if (id) {
        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`);
            const candidate = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(candidate.message || 'Candidato não encontrado.');
            state.candidates = [candidate];
            renderCandidates();
        } catch (error) {
            state.candidates = [];
            renderCandidates();
            showToast(error.message, true);
        }
        return;
    }

    const query = new URLSearchParams();
    if (name) query.set('nome', name);
    if (cargo) query.set('cargo', cargo);
    if (status) query.set('status', status);

    try {
        const response = await fetch(`${API_URL}?${query}`);
        if (!response.ok) throw new Error('Não foi possível consultar os candidatos.');
        state.candidates = await response.json();
        renderCandidates();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function loadIndicators() {
    try {
        const response = await fetch(`${API_URL}/indicadores`);
        if (!response.ok) throw new Error('Não foi possível carregar os indicadores.');
        const data = await response.json();
        $('#metric-total').textContent = data.total;
        $('#metric-analysis').textContent = data.emAnalise;
        $('#metric-approved').textContent = data.aprovados;
        $('#metric-rejected').textContent = data.reprovados;
        $('#metric-hired').textContent = data.contratados;
    } catch (error) {
        showToast(error.message, true);
    }
}

function renderCandidates() {
    const body = $('#candidates-body');
    body.innerHTML = state.candidates.map(candidateRow).join('');
    $('#empty-state').hidden = state.candidates.length > 0;
    $('#result-count').textContent = `${state.candidates.length} ${state.candidates.length === 1 ? 'resultado' : 'resultados'}`;
}

function candidateRow(candidate) {
    const initials = candidate.nome.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    const salary = candidate.salario == null ? 'Salário não informado' : formatCurrency(candidate.salario);
    return `<tr>
        <td><div class="candidate-cell"><span class="avatar">${escapeHtml(initials)}</span><div><strong>${escapeHtml(candidate.nome)}</strong><small>${escapeHtml(candidate.email)} · ID ${candidate.id}</small></div></div></td>
        <td><div class="job-cell"><strong>${escapeHtml(candidate.cargo)}</strong><small>${escapeHtml(candidate.departamento || 'Departamento não informado')}</small></div></td>
        <td>${escapeHtml(candidate.cidade || 'Não informado')}<br><small>${escapeHtml(salary)}</small></td>
        <td><span class="status status-${candidate.status}">${statusLabel(candidate.status)}</span></td>
        <td><div class="row-actions"><button class="row-action" type="button" onclick="editCandidate(${candidate.id})">Editar</button><button class="row-action" type="button" onclick="openPatch(${candidate.id})">PATCH</button><button class="row-action danger" type="button" onclick="deleteCandidate(${candidate.id})">Excluir</button></div></td>
    </tr>`;
}

async function saveCandidate(event) {
    event.preventDefault();
    const id = $('#candidate-id').value;
    const payload = {
        nome: $('#nome').value.trim(),
        email: $('#email').value.trim(),
        telefone: $('#telefone').value.trim() || null,
        cargo: $('#cargo').value.trim(),
        departamento: $('#departamento').value.trim() || null,
        salario: $('#salario').value ? Number($('#salario').value) : null,
        cidade: $('#cidade').value.trim() || null,
        status: $('#status').value || null
    };
    const method = id ? 'PUT' : 'POST';
    try {
        const response = await fetch(id ? `${API_URL}/${id}` : API_URL, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await ensureSuccess(response);
        showToast(id ? 'Candidato atualizado com PUT.' : 'Candidato cadastrado com POST.');
        resetForm();
        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function editCandidate(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const candidate = await response.json();
        if (!response.ok) throw new Error(candidate.message || 'Candidato não encontrado.');
        $('#candidate-id').value = candidate.id;
        $('#nome').value = candidate.nome || '';
        $('#email').value = candidate.email || '';
        $('#telefone').value = candidate.telefone || '';
        $('#cargo').value = candidate.cargo || '';
        $('#departamento').value = candidate.departamento || '';
        $('#salario').value = candidate.salario ?? '';
        $('#cidade').value = candidate.cidade || '';
        $('#status').value = candidate.status || 'EM_ANALISE';
        $('#form-eyebrow').textContent = 'Edição completa';
        $('#form-title').textContent = `Editar #${candidate.id}`;
        $('#form-description').textContent = 'Salve o formulário para substituir todos os dados usando PUT.';
        $('#submit-button').textContent = 'Salvar alterações (PUT)';
        $('#cancel-edit-button').hidden = false;
        $('#form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        showToast(error.message, true);
    }
}

async function deleteCandidate(id) {
    const candidate = state.candidates.find((item) => item.id === id);
    if (!candidate || !window.confirm(`Excluir o cadastro de ${candidate.nome}?`)) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        await ensureSuccess(response);
        showToast('Candidato excluído com DELETE.');
        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
}

function openPatch(id) {
    const candidate = state.candidates.find((item) => item.id === id);
    if (!candidate) return;
    $('#patch-id').value = id;
    $('#patch-status').value = candidate.status || 'EM_ANALISE';
    $('#patch-salary').value = candidate.salario ?? '';
    $('#patch-title').textContent = `Alterar ${candidate.nome}`;
    $('#patch-modal').hidden = false;
    $('#patch-status').focus();
}

async function savePatch(event) {
    event.preventDefault();
    const id = $('#patch-id').value;
    const payload = { status: $('#patch-status').value };
    if ($('#patch-salary').value !== '') payload.salario = Number($('#patch-salary').value);
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await ensureSuccess(response);
        closePatchModal();
        showToast('Candidato atualizado parcialmente com PATCH.');
        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
}

function closePatchModal() { $('#patch-modal').hidden = true; }

function resetForm() {
    $('#candidate-form').reset();
    $('#candidate-id').value = '';
    $('#status').value = 'EM_ANALISE';
    $('#form-eyebrow').textContent = 'Cadastro';
    $('#form-title').textContent = 'Novo candidato';
    $('#form-description').textContent = 'Preencha os dados para incluir uma pessoa no pipeline.';
    $('#submit-button').textContent = 'Cadastrar candidato';
    $('#cancel-edit-button').hidden = true;
}

async function ensureSuccess(response) {
    if (response.ok) return;
    const data = await response.json().catch(() => ({}));
    const fields = data.fields ? ` ${Object.values(data.fields).join(' ')}` : '';
    throw new Error((data.message || 'A operação não pôde ser concluída.') + fields);
}

function statusLabel(status) {
    return { EM_ANALISE: 'Em análise', APROVADO: 'Aprovado', REPROVADO: 'Reprovado', CONTRATADO: 'Contratado' }[status] || status;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function showToast(message, error = false) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('show');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 3500);
}
