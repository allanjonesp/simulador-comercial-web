/**
 * ========================================================
 * SIMULADOR COMERCIAL - Lógica em JavaScript (Versão Web)
 * ========================================================
 * 
 * Funcionalidades:
 * 1. Sanitização rigorosa de entradas: impede números negativos e trata vazios.
 * 2. Arredondamento monetário de 2 casas decimais (elimina erros de ponto flutuante).
 * 3. Margem líquida aprimorada: exibe '—' quando faturamento for zero com despesas.
 * 4. Acessibilidade dinâmica: atualiza atributos ARIA da barra de progresso.
 * 5. Formulário flexível: não trava o botão 'Calcular' se custos forem zero.
 */

// 1. CAPTURA DOS ELEMENTOS DA PÁGINA (DOM)
const form = document.getElementById("simulador-form");
const inputFaturamento = document.getElementById("faturamento");
const inputMeta = document.getElementById("meta");
const inputCustos = document.getElementById("custos");
const inputDespesas = document.getElementById("despesas");
const btnLimpar = document.getElementById("btn-limpar");

// Elementos da Meta
const elValorPercentualMeta = document.getElementById("valor-percentual-meta");
const barraProgresso = document.getElementById("barra-progresso");
const textoProgressoMeta = document.getElementById("texto-progresso-meta");

// Elementos dos Resultados Principais
const cardLucroBruto = document.getElementById("card-lucro-bruto");
const cardLucroLiquido = document.getElementById("card-lucro-liquido");
const cardMargemLiquida = document.getElementById("card-margem-liquida");

const elValorLucroBruto = document.getElementById("valor-lucro-bruto");
const elValorLucroLiquido = document.getElementById("valor-lucro-liquido");
const elValorMargemLiquida = document.getElementById("valor-margem-liquida");

// Elementos do Gráfico de Composição
const sliceCustos = document.getElementById("slice-custos");
const sliceDespesas = document.getElementById("slice-despesas");
const sliceLucro = document.getElementById("slice-lucro");
const graficoLegendaTipo = document.getElementById("grafico-legenda-tipo");

const legendaValorCustos = document.getElementById("legenda-valor-custos");
const legendaValorDespesas = document.getElementById("legenda-valor-despesas");
const legendaValorLucro = document.getElementById("legenda-valor-lucro");
const legendaItemLucro = document.getElementById("legenda-item-lucro");

// Elementos de Prejuízo Separado
const cardPrejuizoSeparado = document.getElementById("card-prejuizo-separado");
const valorPrejuizoDestaque = document.getElementById("valor-prejuizo-destaque");

// Diagnóstico / Status
const statusBox = document.getElementById("status-box");
const statusTexto = document.getElementById("status-texto");

/**
 * 2. FUNÇÕES DE SANITIZAÇÃO E FORMATAÇÃO
 */
function sanitizarValor(campoInput) {
  const valor = parseFloat(campoInput.value);
  if (isNaN(valor) || valor < 0) {
    return 0;
  }
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function formatarPercentual(valor) {
  return (
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor) + "%"
  );
}

/**
 * 3. FUNÇÃO PRINCIPAL DE CÁLCULO
 */
function calcularSimulacao() {
  const faturamento = sanitizarValor(inputFaturamento);
  const meta = sanitizarValor(inputMeta);
  const custos = sanitizarValor(inputCustos);
  const despesas = sanitizarValor(inputDespesas);

  const lucroBruto = Math.round((faturamento - custos + Number.EPSILON) * 100) / 100;
  const lucroLiquido = Math.round((lucroBruto - despesas + Number.EPSILON) * 100) / 100;

  elValorLucroBruto.textContent = formatarMoeda(lucroBruto);
  elValorLucroLiquido.textContent = formatarMoeda(lucroLiquido);

  if (faturamento > 0) {
    const margemLiquida = (lucroLiquido / faturamento) * 100;
    elValorMargemLiquida.textContent = formatarPercentual(margemLiquida);
    aplicarEstiloResultado(cardMargemLiquida, margemLiquida);
  } else {
    cardMargemLiquida.classList.remove("positive", "negative");
    if (custos === 0 && despesas === 0) {
      elValorMargemLiquida.textContent = "0,00%";
    } else {
      elValorMargemLiquida.textContent = "—";
      elValorMargemLiquida.title = "Sem receita realizada para calcular margem percentual.";
      cardMargemLiquida.classList.add("negative");
    }
  }

  aplicarEstiloResultado(cardLucroBruto, lucroBruto);
  aplicarEstiloResultado(cardLucroLiquido, lucroLiquido);

  atualizarMeta(faturamento, meta);
  atualizarGrafico(faturamento, custos, despesas, lucroLiquido);
  atualizarDiagnostico(lucroLiquido, faturamento);
}

/**
 * Atualiza o progresso da meta e atributos ARIA
 */
function atualizarMeta(faturamento, meta) {
  if (meta <= 0) {
    elValorPercentualMeta.textContent = "0,00%";
    barraProgresso.style.width = "0%";
    barraProgresso.setAttribute("aria-valuenow", "0");
    barraProgresso.classList.remove("meta-superada");
    textoProgressoMeta.textContent = "Meta não informada (adicione um valor acima).";
    return;
  }

  const percentualAtingido = (faturamento / meta) * 100;
  elValorPercentualMeta.textContent = formatarPercentual(percentualAtingido);

  const larguraVisual = Math.min(Math.max(percentualAtingido, 0), 100);
  barraProgresso.style.width = `${larguraVisual}%`;
  barraProgresso.setAttribute("aria-valuenow", Math.round(percentualAtingido));

  if (percentualAtingido >= 100) {
    barraProgresso.classList.add("meta-superada");
    const excedente = faturamento - meta;
    textoProgressoMeta.innerHTML = `🎉 <strong>Meta superada!</strong> Você atingiu ${formatarPercentual(percentualAtingido)} (+${formatarMoeda(excedente)} acima da meta).`;
  } else {
    barraProgresso.classList.remove("meta-superada");
    const faltam = meta - faturamento;
    textoProgressoMeta.innerHTML = `Faltam <strong>${formatarMoeda(faltam)}</strong> para atingir a meta mensal de <strong>${formatarMoeda(meta)}</strong>.`;
  }
}

/**
 * Atualiza o gráfico de composição financeira
 */
function atualizarGrafico(faturamento, custos, despesas, lucroLiquido) {
  legendaValorCustos.textContent = formatarMoeda(custos);
  legendaValorDespesas.textContent = formatarMoeda(despesas);

  if (faturamento === 0 && custos === 0 && despesas === 0) {
    sliceCustos.style.width = "0%";
    sliceDespesas.style.width = "0%";
    sliceLucro.style.width = "0%";
    legendaValorLucro.textContent = formatarMoeda(0);
    legendaItemLucro.classList.remove("hidden");
    cardPrejuizoSeparado.classList.add("hidden");
    graficoLegendaTipo.textContent = "Aguardando dados";
    return;
  }

  if (lucroLiquido >= 0) {
    cardPrejuizoSeparado.classList.add("hidden");
    legendaItemLucro.classList.remove("hidden");
    legendaValorLucro.textContent = formatarMoeda(lucroLiquido);
    graficoLegendaTipo.textContent = "Distribuição da Receita Realizada";

    const baseCalculo = faturamento > 0 ? faturamento : (custos + despesas + lucroLiquido);
    
    const pctCustos = baseCalculo > 0 ? (custos / baseCalculo) * 100 : 0;
    const pctDespesas = baseCalculo > 0 ? (despesas / baseCalculo) * 100 : 0;
    const pctLucro = baseCalculo > 0 ? (lucroLiquido / baseCalculo) * 100 : 0;

    sliceCustos.style.width = `${pctCustos}%`;
    sliceDespesas.style.width = `${pctDespesas}%`;
    sliceLucro.style.width = `${pctLucro}%`;
    
    sliceCustos.title = `Custos: ${formatarPercentual(pctCustos)} (${formatarMoeda(custos)})`;
    sliceDespesas.title = `Despesas: ${formatarPercentual(pctDespesas)} (${formatarMoeda(despesas)})`;
    sliceLucro.title = `Lucro Líquido: ${formatarPercentual(pctLucro)} (${formatarMoeda(lucroLiquido)})`;
  } else {
    sliceLucro.style.width = "0%";
    legendaItemLucro.classList.add("hidden");

    const totalGastos = custos + despesas;
    const pctCustos = totalGastos > 0 ? (custos / totalGastos) * 100 : 50;
    const pctDespesas = totalGastos > 0 ? (despesas / totalGastos) * 100 : 50;

    sliceCustos.style.width = `${pctCustos}%`;
    sliceDespesas.style.width = `${pctDespesas}%`;
    graficoLegendaTipo.textContent = "Divisão dos Gastos Totais (100%)";

    sliceCustos.title = `Custos: ${formatarPercentual(pctCustos)} dos gastos totais`;
    sliceDespesas.title = `Despesas: ${formatarPercentual(pctDespesas)} dos gastos totais`;

    cardPrejuizoSeparado.classList.remove("hidden");
    valorPrejuizoDestaque.textContent = `- ${formatarMoeda(Math.abs(lucroLiquido))}`;
  }
}

function aplicarEstiloResultado(elementoCard, valor) {
  elementoCard.classList.remove("positive", "negative");
  if (valor > 0) {
    elementoCard.classList.add("positive");
  } else if (valor < 0) {
    elementoCard.classList.add("negative");
  }
}

function atualizarDiagnostico(lucroLiquido, faturamento) {
  statusBox.className = "status-box";

  if (faturamento === 0) {
    statusBox.classList.add("neutral");
    statusBox.querySelector(".status-icon").textContent = "💡";
    statusTexto.innerHTML = "Informe o <strong>Faturamento</strong> para calcular as margens e a composição com precisão.";
    return;
  }

  const margem = (lucroLiquido / faturamento) * 100;

  if (lucroLiquido > 0) {
    statusBox.classList.add("success");
    statusBox.querySelector(".status-icon").textContent = "✅";
    statusTexto.innerHTML = `<strong>Operação lucrativa!</strong> Lucro líquido de <strong>${formatarMoeda(lucroLiquido)}</strong> (margem de <strong>${formatarPercentual(margem)}</strong>). Parabéns pelo resultado!`;
  } else if (lucroLiquido === 0) {
    statusBox.classList.add("neutral");
    statusBox.querySelector(".status-icon").textContent = "⚖️";
    statusTexto.innerHTML = "<strong>Ponto de equilíbrio (Break-even):</strong> Suas receitas pagam exatamente os custos e despesas, sem sobra e sem déficit.";
  } else {
    statusBox.classList.add("danger");
    statusBox.querySelector(".status-icon").textContent = "⚠️";
    statusTexto.innerHTML = `<strong>Atenção: Operação com prejuízo!</strong> O déficit atual é de <strong>${formatarMoeda(Math.abs(lucroLiquido))}</strong> (${formatarPercentual(margem)}). Verifique o destaque de prejuízo acima.`;
  }
}

/**
 * 4. EVENTOS DE INTERAÇÃO
 */
form.addEventListener("submit", function (evento) {
  evento.preventDefault();
  calcularSimulacao();
});

[inputFaturamento, inputMeta, inputCustos, inputDespesas].forEach(function (campo) {
  campo.addEventListener("input", function () {
    if (inputFaturamento.value || inputMeta.value || inputCustos.value || inputDespesas.value) {
      calcularSimulacao();
    }
  });
});

btnLimpar.addEventListener("click", function () {
  form.reset();

  elValorLucroBruto.textContent = "R$ 0,00";
  elValorLucroLiquido.textContent = "R$ 0,00";
  elValorMargemLiquida.textContent = "0,00%";
  elValorMargemLiquida.removeAttribute("title");

  [cardLucroBruto, cardLucroLiquido, cardMargemLiquida].forEach(card => {
    card.classList.remove("positive", "negative");
  });

  elValorPercentualMeta.textContent = "0,00%";
  barraProgresso.style.width = "0%";
  barraProgresso.setAttribute("aria-valuenow", "0");
  barraProgresso.classList.remove("meta-superada");
  textoProgressoMeta.textContent = "Meta não informada (adicione um valor acima).";

  sliceCustos.style.width = "0%";
  sliceDespesas.style.width = "0%";
  sliceLucro.style.width = "0%";
  legendaValorCustos.textContent = "R$ 0,00";
  legendaValorDespesas.textContent = "R$ 0,00";
  legendaValorLucro.textContent = "R$ 0,00";
  legendaItemLucro.classList.remove("hidden");
  cardPrejuizoSeparado.classList.add("hidden");
  graficoLegendaTipo.textContent = "Aguardando dados";

  statusBox.className = "status-box neutral";
  statusBox.querySelector(".status-icon").textContent = "💡";
  statusTexto.innerHTML = "Preencha os valores ao lado e clique em <strong>Calcular</strong> para visualizar a saúde financeira.";
});
