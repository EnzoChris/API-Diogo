package exercicio.diogo.errors;

public class FuncionarioNotFoundException extends RuntimeException {

    public FuncionarioNotFoundException(Long id) {
        super("Funcionário com ID " + id + " não foi encontrado");
    }
}
