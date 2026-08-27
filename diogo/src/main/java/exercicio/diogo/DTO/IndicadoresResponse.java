package exercicio.diogo.DTO;

public record IndicadoresResponse(
        long total,
        long emAnalise,
        long aprovados,
        long reprovados,
        long contratados
) {
}
