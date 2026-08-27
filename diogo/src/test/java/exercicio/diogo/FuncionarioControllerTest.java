package exercicio.diogo;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FuncionarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deveExecutarCicloCompletoDoCrud() throws Exception {
        String cadastro = """
                {
                  "nome": "Teste do CRUD",
                  "email": "crud@teste.com",
                  "telefone": "11999990000",
                  "cargo": "Desenvolvedor",
                  "departamento": "Tecnologia",
                  "salario": 5000,
                  "cidade": "São Paulo",
                  "status": "EM_ANALISE"
                }
                """;

        String response = mockMvc.perform(post("/funcionarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cadastro))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Teste do CRUD"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Long id = ((Number) JsonPath.read(response, "$.id")).longValue();

        mockMvc.perform(get("/funcionarios/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("crud@teste.com"));

        mockMvc.perform(patch("/funcionarios/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"APROVADO\",\"salario\":5500}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADO"))
                .andExpect(jsonPath("$.nome").value("Teste do CRUD"));

        String atualizacaoCompleta = """
                {
                  "nome": "Teste do CRUD Atualizado",
                  "email": "crud.atualizado@teste.com",
                  "telefone": "11988880000",
                  "cargo": "Tech Lead",
                  "departamento": "Engenharia",
                  "salario": 8000,
                  "cidade": "Campinas",
                  "status": "CONTRATADO"
                }
                """;
        mockMvc.perform(put("/funcionarios/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(atualizacaoCompleta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cargo").value("Tech Lead"))
                .andExpect(jsonPath("$.status").value("CONTRATADO"));

        mockMvc.perform(delete("/funcionarios/{id}", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/funcionarios/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Funcionário com ID " + id + " não foi encontrado"));
    }

    @Test
    void deveValidarCamposObrigatorios() throws Exception {
        mockMvc.perform(post("/funcionarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"telefone\":\"11999999999\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.nome").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.cargo").exists());
    }

    @Test
    void deveImpedirQuePatchEPutQuebremAsRegrasObrigatorias() throws Exception {
        mockMvc.perform(patch("/funcionarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"   \",\"cargo\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.nome").exists())
                .andExpect(jsonPath("$.fields.cargo").exists());

        mockMvc.perform(put("/funcionarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Nome válido\",\"email\":\"nome@teste.com\",\"cargo\":\"Cargo válido\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O status é obrigatório na atualização completa"));
    }

    @Test
    void deveConsultarIndicadoresEFiltrarResultados() throws Exception {
        mockMvc.perform(get("/funcionarios")
                        .param("cargo", "Java")
                        .param("status", "EM_ANALISE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].cargo").value("Desenvolvedora Java"));

        mockMvc.perform(get("/funcionarios/indicadores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.emAnalise").isNumber())
                .andExpect(jsonPath("$.reprovados").isNumber())
                .andExpect(jsonPath("$.contratados").isNumber());
    }
}
