(function () {
  "use strict";

  const API_BASE = "/funcionarios";

  const STATUS_LABEL = {
    EM_ANALISE: "Em análise",
    APROVADO: "Aprovado",
    REPROVADO: "Reprovado",
    CONTRATADO: "Contratado"
  };

  /* ============================================================
     Utilidades
  ============================================================ */

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function showToast(message, type) {
    const toast = qs("#toast");
    toast.textContent = message;
    toast.className = "toast show " + (type || "success");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.className = "toast";
    }, 3500);
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function statusBadge(status) {
    if (!status) return "-";
    const label = STATUS_LABEL[status] || status;
    return `<span class="status-badge status-${status}">${label}</span>`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ============================================================
     Camada de acesso à API
  ============================================================ */

  async function apiRequest(path, options) {
    const response = await fetch(API_BASE + path, Object.assign({
      headers: { "Content-Type": "application/json" }
    }, options));

    if (response.status === 204) {
      return null;
    }

    let data = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = text; }
    }

    if (!response.ok) {
      const message = extractErrorMessage(data) || `Erro ${response.status} ao comunicar com o servidor`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function extractErrorMessage(data) {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map(e => e.message || e.defaultMessage || e).join(" | ");
    }
    if (data.error) return data.error;
    return null;
  }

  const api = {
    listar(params) {
      const query = new URLSearchParams();
      if (params.nome) query.set("nome", params.nome);
      if (params.cargo) query.set("cargo", params.cargo);
      if (params.status) query.set("status", params.status);
      const qsStr = query.toString();
      return apiRequest("" + (qsStr ? "?" + qsStr : ""), { method: "GET" });
    },
    indicadores() {
      return apiRequest("/indicadores", { method: "GET" });
    },
    buscarPorId(id) {
      return apiRequest("/" + id, { method: "GET" });
    },
    criar(payload) {
      return apiRequest("", { method: "POST", body: JSON.stringify(payload) });
    },
    atualizarCompleto(id, payload) {
      return apiRequest("/" + id, { method: "PUT", body: JSON.stringify(payload) });
    },
    atualizarParcial(id, payload) {
      return apiRequest("/" + id, { method: "PATCH", body: JSON.stringify(payload) });
    },
    excluir(id) {
      return apiRequest("/" + id, { method: "DELETE" });
    }
  };

  /* ============================================================
     Navegação entre telas
  ============================================================ */

  function setActiveView(viewName) {
    qsa(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === viewName));
    qsa(".view").forEach(view => view.classList.toggle("active", view.id === "view-" + viewName));

    if (viewName === "listagem") {
      carregarListagem();
    } else if (viewName === "indicadores") {
      carregarIndicadores();
    }
  }

  function initNav() {
    qsa(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => setActiveView(btn.dataset.view));
    });
  }

  /* ============================================================
     Listagem / Busca (GET /funcionarios)
  ============================================================ */

  async function carregarListagem() {
    const loading = qs("#listagem-loading");
    const vazio = qs("#listagem-vazio");
    const tabela = qs("#tabela-funcionarios");
    const tbody = qs("#tabela-funcionarios-body");

    loading.classList.remove("hidden");
    vazio.classList.add("hidden");
    tabela.classList.add("hidden");

    const params = {
      nome: qs("#busca-nome").value.trim(),
      cargo: qs("#busca-cargo").value.trim(),
      status: qs("#busca-status").value
    };

    try {
      const funcionarios = await api.listar(params);
      loading.classList.add("hidden");

      if (!funcionarios || funcionarios.length === 0) {
        vazio.classList.remove("hidden");
        return;
      }

      tbody.innerHTML = funcionarios.map(renderLinhaFuncionario).join("");
      tabela.classList.remove("hidden");

      qsa(".btn-detalhe", tbody).forEach(btn => {
        btn.addEventListener("click", () => abrirModal(btn.dataset.id));
      });
      qsa(".btn-excluir-linha", tbody).forEach(btn => {
        btn.addEventListener("click", () => excluirFuncionario(btn.dataset.id));
      });
    } catch (err) {
      loading.classList.add("hidden");
      showToast(err.message, "error");
    }
  }

  function renderLinhaFuncionario(f) {
    return `
      <tr>
        <td>${f.id}</td>
        <td>${escapeHtml(f.nome)}</td>
        <td>${escapeHtml(f.email)}</td>
        <td>${escapeHtml(f.telefone || "-")}</td>
        <td>${escapeHtml(f.cargo)}</td>
        <td>${escapeHtml(f.departamento || "-")}</td>
        <td>${formatCurrency(f.salario)}</td>
        <td>${escapeHtml(f.cidade || "-")}</td>
        <td>${statusBadge(f.status)}</td>
        <td class="actions-cell">
          <button type="button" class="btn-small btn-detalhe" data-id="${f.id}">Ver / Editar</button>
          <button type="button" class="btn-small btn-excluir-linha" data-id="${f.id}">Excluir</button>
        </td>
      </tr>`;
  }

  function initBusca() {
    qs("#form-busca").addEventListener("submit", (e) => {
      e.preventDefault();
      carregarListagem();
    });
    qs("#btn-limpar-busca").addEventListener("click", () => {
      qs("#busca-nome").value = "";
      qs("#busca-cargo").value = "";
      qs("#busca-status").value = "";
      carregarListagem();
    });
  }

  /* ============================================================
     Excluir (DELETE /funcionarios/{id})
  ============================================================ */

  async function excluirFuncionario(id) {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;
    try {
      await api.excluir(id);
      showToast("Funcionário excluído com sucesso.", "success");
      fecharModal();
      carregarListagem();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  /* ============================================================
     Cadastro (POST /funcionarios)
  ============================================================ */

  function limparErros(form) {
    qsa(".field", form).forEach(field => field.classList.remove("has-error"));
    qsa(".field-error", form).forEach(span => span.textContent = "");
  }

  function marcarErroCampo(fieldId, mensagem) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const field = input.closest(".field");
    if (field) field.classList.add("has-error");
    const errorSpan = qs(`[data-error-for="${fieldId}"]`);
    if (errorSpan) errorSpan.textContent = mensagem;
  }

  function validarObrigatorios(campos) {
    let valido = true;
    campos.forEach(({ id, valor, mensagem }) => {
      if (!valor || !valor.trim()) {
        marcarErroCampo(id, mensagem);
        valido = false;
      }
    });
    return valido;
  }

  function initCadastro() {
    const form = qs("#form-cadastro");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      limparErros(form);

      const nome = qs("#cad-nome").value;
      const email = qs("#cad-email").value;
      const cargo = qs("#cad-cargo").value;

      const valido = validarObrigatorios([
        { id: "cad-nome", valor: nome, mensagem: "O nome é obrigatório" },
        { id: "cad-email", valor: email, mensagem: "O e-mail é obrigatório" },
        { id: "cad-cargo", valor: cargo, mensagem: "O cargo é obrigatório" }
      ]);
      if (!valido) return;

      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: qs("#cad-telefone").value.trim() || null,
        cargo: cargo.trim(),
        departamento: qs("#cad-departamento").value.trim() || null,
        salario: qs("#cad-salario").value ? Number(qs("#cad-salario").value) : null,
        cidade: qs("#cad-cidade").value.trim() || null,
        status: qs("#cad-status").value || null
      };

      const btnSubmit = qs('button[type="submit"]', form);
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Cadastrando...";

      try {
        await api.criar(payload);
        showToast("Funcionário cadastrado com sucesso.", "success");
        form.reset();
        setActiveView("listagem");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Cadastrar";
      }
    });
  }

  /* ============================================================
     Indicadores (GET /funcionarios/indicadores)
  ============================================================ */

  async function carregarIndicadores() {
    const loading = qs("#indicadores-loading");
    loading.classList.remove("hidden");
    try {
      const dados = await api.indicadores();
      qs("#ind-total").textContent = dados.total;
      qs("#ind-em-analise").textContent = dados.emAnalise;
      qs("#ind-aprovados").textContent = dados.aprovados;
      qs("#ind-reprovados").textContent = dados.reprovados;
      qs("#ind-contratados").textContent = dados.contratados;
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      loading.classList.add("hidden");
    }
  }

  /* ============================================================
     Modal: Detalhe (GET por id) / Editar completo (PUT) / Editar parcial (PATCH)
  ============================================================ */

  let funcionarioAtualId = null;

  function initModal() {
    qs("#modal-close").addEventListener("click", fecharModal);
    qs("#modal-overlay").addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") fecharModal();
    });

    qsa(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        qsa(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
        qsa(".tab-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === btn.dataset.tab));
      });
    });

    qs("#btn-excluir").addEventListener("click", () => {
      if (funcionarioAtualId) excluirFuncionario(funcionarioAtualId);
    });

    qs("#form-editar-completo").addEventListener("submit", submeterEdicaoCompleta);
    qs("#form-editar-parcial").addEventListener("submit", submeterEdicaoParcial);
  }

  async function abrirModal(id) {
    try {
      const funcionario = await api.buscarPorId(id);
      funcionarioAtualId = funcionario.id;
      preencherDetalhe(funcionario);
      preencherFormularioCompleto(funcionario);
      preencherFormularioParcial(funcionario.id);

      qsa(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === "detalhe"));
      qsa(".tab-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === "detalhe"));

      qs("#modal-overlay").classList.remove("hidden");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function fecharModal() {
    qs("#modal-overlay").classList.add("hidden");
    funcionarioAtualId = null;
  }

  function preencherDetalhe(f) {
    qs("#modal-title").textContent = `Funcionário #${f.id}`;
    qs("#detalhe-conteudo").innerHTML = `
      <dt>Nome</dt><dd>${escapeHtml(f.nome)}</dd>
      <dt>Email</dt><dd>${escapeHtml(f.email)}</dd>
      <dt>Telefone</dt><dd>${escapeHtml(f.telefone || "-")}</dd>
      <dt>Cargo</dt><dd>${escapeHtml(f.cargo)}</dd>
      <dt>Departamento</dt><dd>${escapeHtml(f.departamento || "-")}</dd>
      <dt>Salário</dt><dd>${formatCurrency(f.salario)}</dd>
      <dt>Cidade</dt><dd>${escapeHtml(f.cidade || "-")}</dd>
      <dt>Status</dt><dd>${statusBadge(f.status)}</dd>
    `;
  }

  function preencherFormularioCompleto(f) {
    const form = qs("#form-editar-completo");
    limparErros(form);
    qs("#put-id").value = f.id;
    qs("#put-nome").value = f.nome || "";
    qs("#put-email").value = f.email || "";
    qs("#put-telefone").value = f.telefone || "";
    qs("#put-cargo").value = f.cargo || "";
    qs("#put-departamento").value = f.departamento || "";
    qs("#put-salario").value = f.salario != null ? f.salario : "";
    qs("#put-cidade").value = f.cidade || "";
    qs("#put-status").value = f.status || "EM_ANALISE";
  }

  function preencherFormularioParcial(id) {
    const form = qs("#form-editar-parcial");
    form.reset();
    qs("#patch-id").value = id;
  }

  async function submeterEdicaoCompleta(e) {
    e.preventDefault();
    const form = e.target;
    limparErros(form);

    const id = qs("#put-id").value;
    const nome = qs("#put-nome").value;
    const email = qs("#put-email").value;
    const cargo = qs("#put-cargo").value;

    const valido = validarObrigatorios([
      { id: "put-nome", valor: nome, mensagem: "O nome é obrigatório" },
      { id: "put-email", valor: email, mensagem: "O e-mail é obrigatório" },
      { id: "put-cargo", valor: cargo, mensagem: "O cargo é obrigatório" }
    ]);
    if (!valido) return;

    const payload = {
      nome: nome.trim(),
      email: email.trim(),
      telefone: qs("#put-telefone").value.trim() || null,
      cargo: cargo.trim(),
      departamento: qs("#put-departamento").value.trim() || null,
      salario: qs("#put-salario").value ? Number(qs("#put-salario").value) : null,
      cidade: qs("#put-cidade").value.trim() || null,
      status: qs("#put-status").value
    };

    const btnSubmit = qs('button[type="submit"]', form);
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Salvando...";

    try {
      await api.atualizarCompleto(id, payload);
      showToast("Funcionário atualizado com sucesso.", "success");
      fecharModal();
      carregarListagem();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Salvar (PUT)";
    }
  }

  async function submeterEdicaoParcial(e) {
    e.preventDefault();
    const form = e.target;
    const id = qs("#patch-id").value;

    const campos = {
      nome: qs("#patch-nome").value.trim(),
      email: qs("#patch-email").value.trim(),
      telefone: qs("#patch-telefone").value.trim(),
      cargo: qs("#patch-cargo").value.trim(),
      departamento: qs("#patch-departamento").value.trim(),
      salario: qs("#patch-salario").value,
      cidade: qs("#patch-cidade").value.trim(),
      status: qs("#patch-status").value
    };

    const payload = {};
    if (campos.nome) payload.nome = campos.nome;
    if (campos.email) payload.email = campos.email;
    if (campos.telefone) payload.telefone = campos.telefone;
    if (campos.cargo) payload.cargo = campos.cargo;
    if (campos.departamento) payload.departamento = campos.departamento;
    if (campos.salario) payload.salario = Number(campos.salario);
    if (campos.cidade) payload.cidade = campos.cidade;
    if (campos.status) payload.status = campos.status;

    if (Object.keys(payload).length === 0) {
      showToast("Informe ao menos um campo para atualizar.", "error");
      return;
    }

    const btnSubmit = qs('button[type="submit"]', form);
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Salvando...";

    try {
      await api.atualizarParcial(id, payload);
      showToast("Funcionário atualizado parcialmente com sucesso.", "success");
      fecharModal();
      carregarListagem();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Salvar (PATCH)";
    }
  }

  /* ============================================================
     Inicialização
  ============================================================ */

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initBusca();
    initCadastro();
    initModal();
    carregarListagem();
  });

})();
