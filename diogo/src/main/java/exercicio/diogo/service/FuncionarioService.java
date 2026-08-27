package exercicio.diogo.service;

import exercicio.diogo.DTO.FuncionarioPatchRequest;
import exercicio.diogo.DTO.FuncionarioRequest;
import exercicio.diogo.DTO.FuncionarioResponse;
import exercicio.diogo.DTO.IndicadoresResponse;
import exercicio.diogo.errors.FuncionarioNotFoundException;
import exercicio.diogo.model.Funcionario;
import exercicio.diogo.model.StatusFuncionario;
import exercicio.diogo.repository.FuncionarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class FuncionarioService {

    private final FuncionarioRepository repository;
    private final AtomicLong proximoId = new AtomicLong(1);

    public FuncionarioService(FuncionarioRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void carregarDadosIniciais() {
        salvarExemplo("Mariana Costa", "mariana.costa@picpay.com", "11987654321",
                "Desenvolvedora Java", "Tecnologia", new BigDecimal("7800"), "São Paulo",
                StatusFuncionario.EM_ANALISE);
        salvarExemplo("Rafael Lima", "rafael.lima@picpay.com", "21987654321",
                "Analista de Dados", "Dados", new BigDecimal("6500"), "Rio de Janeiro",
                StatusFuncionario.APROVADO);
        salvarExemplo("Beatriz Alves", "beatriz.alves@picpay.com", "31987654321",
                "Product Designer", "Produto", new BigDecimal("7200"), "Belo Horizonte",
                StatusFuncionario.CONTRATADO);
        salvarExemplo("Lucas Martins", "lucas.martins@picpay.com", "41987654321",
                "Analista de Suporte", "Operações", new BigDecimal("4200"), "Curitiba",
                StatusFuncionario.REPROVADO);
    }

    public List<FuncionarioResponse> listar(String nome, String cargo, StatusFuncionario status) {
        return repository.pesquisar(nome, cargo, status).stream()
                .map(FuncionarioResponse::from)
                .toList();
    }

    public FuncionarioResponse buscarPorId(Long id) {
        return FuncionarioResponse.from(encontrar(id));
    }

    public FuncionarioResponse criar(FuncionarioRequest request) {
        Funcionario funcionario = new Funcionario(
                proximoId.getAndIncrement(), request.getNome().trim(), request.getEmail().trim(),
                request.getTelefone(), request.getCargo().trim(), request.getDepartamento(),
                request.getSalario(), request.getCidade(), statusOuPadrao(request.getStatus())
        );
        return FuncionarioResponse.from(repository.salvar(funcionario));
    }

    public FuncionarioResponse atualizarCompleto(Long id, FuncionarioRequest request) {
        if (request.getStatus() == null) {
            throw new IllegalArgumentException("O status é obrigatório na atualização completa");
        }
        Funcionario funcionario = encontrar(id);
        funcionario.setNome(request.getNome().trim());
        funcionario.setEmail(request.getEmail().trim());
        funcionario.setTelefone(request.getTelefone());
        funcionario.setCargo(request.getCargo().trim());
        funcionario.setDepartamento(request.getDepartamento());
        funcionario.setSalario(request.getSalario());
        funcionario.setCidade(request.getCidade());
        funcionario.setStatus(request.getStatus());
        return FuncionarioResponse.from(funcionario);
    }

    public FuncionarioResponse atualizarParcialmente(Long id, FuncionarioPatchRequest request) {
        if (!request.possuiAlteracoes()) {
            throw new IllegalArgumentException("Informe ao menos um campo para atualizar");
        }

        Funcionario funcionario = encontrar(id);
        if (request.getNome() != null) funcionario.setNome(request.getNome().trim());
        if (request.getEmail() != null) funcionario.setEmail(request.getEmail().trim());
        if (request.getTelefone() != null) funcionario.setTelefone(request.getTelefone());
        if (request.getCargo() != null) funcionario.setCargo(request.getCargo().trim());
        if (request.getDepartamento() != null) funcionario.setDepartamento(request.getDepartamento());
        if (request.getSalario() != null) funcionario.setSalario(request.getSalario());
        if (request.getCidade() != null) funcionario.setCidade(request.getCidade());
        if (request.getStatus() != null) funcionario.setStatus(request.getStatus());
        return FuncionarioResponse.from(funcionario);
    }

    public void excluir(Long id) {
        Funcionario funcionario = encontrar(id);
        repository.excluir(funcionario);
    }

    public IndicadoresResponse indicadores() {
        return new IndicadoresResponse(
                repository.listarTodos().size(),
                repository.contarPorStatus(StatusFuncionario.EM_ANALISE),
                repository.contarPorStatus(StatusFuncionario.APROVADO),
                repository.contarPorStatus(StatusFuncionario.REPROVADO),
                repository.contarPorStatus(StatusFuncionario.CONTRATADO)
        );
    }

    private Funcionario encontrar(Long id) {
        return repository.buscarPorId(id).orElseThrow(() -> new FuncionarioNotFoundException(id));
    }

    private StatusFuncionario statusOuPadrao(StatusFuncionario status) {
        return status == null ? StatusFuncionario.EM_ANALISE : status;
    }

    private void salvarExemplo(String nome, String email, String telefone, String cargo,
                               String departamento, BigDecimal salario, String cidade,
                               StatusFuncionario status) {
        repository.salvar(new Funcionario(proximoId.getAndIncrement(), nome, email, telefone,
                cargo, departamento, salario, cidade, status));
    }
}
