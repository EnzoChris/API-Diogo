package exercicio.diogo.DTO;

import exercicio.diogo.model.StatusFuncionario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class FuncionarioPatchRequest {

    @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres")
    @Pattern(regexp = ".*\\S.*", message = "O nome não pode ficar em branco")
    private String nome;

    @Email(message = "Informe um e-mail válido")
    @Pattern(regexp = ".*\\S.*", message = "O e-mail não pode ficar em branco")
    private String email;

    @Size(max = 30, message = "O telefone deve ter no máximo 30 caracteres")
    private String telefone;

    @Size(max = 100, message = "O cargo deve ter no máximo 100 caracteres")
    @Pattern(regexp = ".*\\S.*", message = "O cargo não pode ficar em branco")
    private String cargo;

    @Size(max = 100, message = "O departamento deve ter no máximo 100 caracteres")
    private String departamento;

    @PositiveOrZero(message = "O salário não pode ser negativo")
    private BigDecimal salario;

    @Size(max = 100, message = "A cidade deve ter no máximo 100 caracteres")
    private String cidade;

    private StatusFuncionario status;

    public boolean possuiAlteracoes() {
        return nome != null || email != null || telefone != null || cargo != null
                || departamento != null || salario != null || cidade != null || status != null;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public BigDecimal getSalario() {
        return salario;
    }

    public void setSalario(BigDecimal salario) {
        this.salario = salario;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public StatusFuncionario getStatus() {
        return status;
    }

    public void setStatus(StatusFuncionario status) {
        this.status = status;
    }
}
