package exercicio.diogo.DTO;

import exercicio.diogo.model.Funcionario;
import exercicio.diogo.model.StatusFuncionario;

import java.math.BigDecimal;

public record FuncionarioResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String cargo,
        String departamento,
        BigDecimal salario,
        String cidade,
        StatusFuncionario status
) {

    public static FuncionarioResponse from(Funcionario funcionario) {
        return new FuncionarioResponse(
                funcionario.getId(),
                funcionario.getNome(),
                funcionario.getEmail(),
                funcionario.getTelefone(),
                funcionario.getCargo(),
                funcionario.getDepartamento(),
                funcionario.getSalario(),
                funcionario.getCidade(),
                funcionario.getStatus()
        );
    }
}
