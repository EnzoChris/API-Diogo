package exercicio.diogo.controller;

import exercicio.diogo.DTO.FuncionarioPatchRequest;
import exercicio.diogo.DTO.FuncionarioRequest;
import exercicio.diogo.DTO.FuncionarioResponse;
import exercicio.diogo.DTO.IndicadoresResponse;
import exercicio.diogo.model.StatusFuncionario;
import exercicio.diogo.service.FuncionarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/funcionarios")
public class FuncionarioController {

    private final FuncionarioService service;

    public FuncionarioController(FuncionarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<FuncionarioResponse> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) StatusFuncionario status) {
        return service.listar(nome, cargo, status);
    }

    @GetMapping("/indicadores")
    public IndicadoresResponse indicadores() {
        return service.indicadores();
    }

    @GetMapping("/{id}")
    public FuncionarioResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<FuncionarioResponse> criar(@Valid @RequestBody FuncionarioRequest request,
                                                     UriComponentsBuilder uriBuilder) {
        FuncionarioResponse response = service.criar(request);
        URI location = uriBuilder.path("/funcionarios/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public FuncionarioResponse atualizarCompleto(@PathVariable Long id,
                                                 @Valid @RequestBody FuncionarioRequest request) {
        return service.atualizarCompleto(id, request);
    }

    @PatchMapping("/{id}")
    public FuncionarioResponse atualizarParcialmente(@PathVariable Long id,
                                                     @Valid @RequestBody FuncionarioPatchRequest request) {
        return service.atualizarParcialmente(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
