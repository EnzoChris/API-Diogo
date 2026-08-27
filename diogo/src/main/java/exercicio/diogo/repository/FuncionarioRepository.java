package exercicio.diogo.repository;

import exercicio.diogo.model.Funcionario;
import exercicio.diogo.model.StatusFuncionario;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class FuncionarioRepository {

    private final ArrayList<Funcionario> funcionarios = new ArrayList<>();

    public synchronized Funcionario salvar(Funcionario funcionario) {
        funcionarios.add(funcionario);
        return funcionario;
    }

    public synchronized List<Funcionario> listarTodos() {
        return new ArrayList<>(funcionarios);
    }

    public synchronized Optional<Funcionario> buscarPorId(Long id) {
        return funcionarios.stream()
                .filter(funcionario -> funcionario.getId().equals(id))
                .findFirst();
    }

    public synchronized void excluir(Funcionario funcionario) {
        funcionarios.remove(funcionario);
    }

    public synchronized List<Funcionario> pesquisar(String nome, String cargo, StatusFuncionario status) {
        return funcionarios.stream()
                .filter(funcionario -> contem(funcionario.getNome(), nome))
                .filter(funcionario -> contem(funcionario.getCargo(), cargo))
                .filter(funcionario -> status == null || funcionario.getStatus() == status)
                .toList();
    }

    public synchronized long contarPorStatus(StatusFuncionario status) {
        return funcionarios.stream()
                .filter(funcionario -> funcionario.getStatus() == status)
                .count();
    }

    private boolean contem(String valor, String filtro) {
        return filtro == null || filtro.isBlank()
                || (valor != null && valor.toLowerCase().contains(filtro.trim().toLowerCase()));
    }
}
