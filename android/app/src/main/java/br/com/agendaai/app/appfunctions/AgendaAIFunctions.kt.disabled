package br.com.agendaai.app.appfunctions

import android.content.Context
import androidx.appfunctions.AppFunction
import androidx.appfunctions.AppFunctionContext
import br.com.agendaai.capacitor.appfunctions.client.AgendaAIClient
import br.com.agendaai.capacitor.appfunctions.dto.AgendamentoDto
import br.com.agendaai.capacitor.appfunctions.dto.CriarAgendamentoBody
import br.com.agendaai.capacitor.appfunctions.dto.CriarPacienteBody
import br.com.agendaai.capacitor.appfunctions.dto.OkResponse
import br.com.agendaai.capacitor.appfunctions.dto.PacienteDto
import br.com.agendaai.capacitor.appfunctions.dto.ProfissionalDto
import br.com.agendaai.capacitor.appfunctions.dto.ServicoDto
import br.com.agendaai.capacitor.appfunctions.dto.SlotLivreDto
import java.time.Instant

/**
 * Funcoes do agendaAI expostas ao Gemini via Android AppFunctions.
 *
 * Cada metodo:
 *   - e anotado com @AppFunction (catalogado em build-time pelo KSP).
 *   - delega para o AgendaAIClient (HTTP + auth) provido pelo plugin Capacitor.
 *   - tem KDoc legivel pra IA mapear linguagem natural -> argumentos.
 *
 * Pre-requisito: o usuario fez login no app, e o AuthService TS empurrou
 * o JWT via `AgendaAIAppFunctions.setAuthToken({ token, apiBaseUrl })`.
 * Se nao houver token, o client lanca [AgendaAIApiException(401)].
 */
class AgendaAIFunctions(context: Context) {

    private val appContext = context.applicationContext
    private val client by lazy { AgendaAIClient(appContext) }

    /**
     * Lista as criancas cadastradas pelo responsavel atual.
     */
    @AppFunction
    suspend fun listarPacientes(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
    ): List<PacienteDto> = client.listarPacientes()

    /**
     * Cadastra uma nova crianca pediatrica.
     *
     * @param nome Nome completo da crianca.
     * @param dataNascimento Data de nascimento em formato YYYY-MM-DD.
     * @param sexo M (masculino), F (feminino) ou O (outro). Padrao O.
     * @param observacoes Observacoes clinicas (opcional).
     */
    @AppFunction
    suspend fun criarPaciente(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
        nome: String,
        dataNascimento: String,
        sexo: String = "O",
        observacoes: String? = null,
    ): PacienteDto = client.criarPaciente(
        CriarPacienteBody(
            nome = nome,
            dataNascimento = dataNascimento,
            sexo = sexo,
            observacoes = observacoes,
        ),
    )

    /**
     * Remove (soft-delete) uma crianca pelo ID. Agendamentos passados sao mantidos.
     *
     * @param pacienteId UUID do paciente.
     */
    @AppFunction
    suspend fun removerPaciente(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
        pacienteId: String,
    ): OkResponse = client.removerPaciente(pacienteId)

    /**
     * Lista os pediatras disponiveis para agendamento.
     */
    @AppFunction
    suspend fun listarProfissionais(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
    ): List<ProfissionalDto> = client.listarProfissionais()

    /**
     * Lista os tipos de atendimento (consulta de rotina, retorno, vacinacao, etc).
     */
    @AppFunction
    suspend fun listarServicos(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
    ): List<ServicoDto> = client.listarServicos()

    /**
     * Lista horarios disponiveis (slots) de um pediatra em uma data
     * para um servico especifico (a duracao do servico define o tamanho do slot).
     *
     * @param profissionalId UUID do pediatra.
     * @param data Data em formato YYYY-MM-DD.
     * @param servicoId UUID do servico.
     */
    @AppFunction
    suspend fun verHorariosDisponiveis(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
        profissionalId: String,
        data: String,
        servicoId: String,
    ): List<SlotLivreDto> = client.verHorariosDisponiveis(profissionalId, data, servicoId)

    /**
     * Cria um novo agendamento. Falha com 409 se o horario ja estiver ocupado
     * pelo profissional.
     *
     * @param pacienteId UUID da crianca.
     * @param profissionalId UUID do pediatra.
     * @param servicoId UUID do servico (define a duracao).
     * @param dataHoraInicio Instante de inicio em formato ISO 8601 (ex: 2026-05-20T13:00:00.000Z).
     * @param observacoes Observacoes do agendamento (opcional).
     */
    @AppFunction
    suspend fun criarAgendamento(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
        pacienteId: String,
        profissionalId: String,
        servicoId: String,
        dataHoraInicio: String,
        observacoes: String? = null,
    ): AgendamentoDto = client.criarAgendamento(
        CriarAgendamentoBody(
            pacienteId = pacienteId,
            profissionalId = profissionalId,
            servicoId = servicoId,
            dataHoraInicio = dataHoraInicio,
            observacoes = observacoes,
        ),
    )

    /**
     * Lista os proximos agendamentos do responsavel (futuros e nao cancelados),
     * ordenados por data crescente.
     */
    @AppFunction
    suspend fun listarProximosAgendamentos(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
    ): List<AgendamentoDto> {
        val agora = Instant.now()
        return client.listarAgendamentos()
            .asSequence()
            .filter { it.status == "AGENDADO" }
            .filter {
                runCatching { Instant.parse(it.dataHoraInicio) }
                    .map { ts -> !ts.isBefore(agora) }
                    .getOrDefault(false)
            }
            .sortedBy { it.dataHoraInicio }
            .toList()
    }

    /**
     * Cancela um agendamento (soft-cancel - mantem no historico).
     *
     * @param agendamentoId UUID do agendamento.
     */
    @AppFunction
    suspend fun cancelarAgendamento(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
        agendamentoId: String,
    ): AgendamentoDto = client.cancelarAgendamento(agendamentoId)

    /**
     * Lista todos os agendamentos do responsavel em um dia.
     *
     * @param data Data em formato YYYY-MM-DD.
     */
    @AppFunction
    suspend fun agendaDoDia(
        @Suppress("UNUSED_PARAMETER") appFunctionContext: AppFunctionContext,
        data: String,
    ): List<AgendamentoDto> = client.listarAgendamentos().filter { it.dataHoraInicio.startsWith(data) }
}
