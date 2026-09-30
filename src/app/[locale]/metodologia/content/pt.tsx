const SECTIONS = [
  ["fontes", "Fontes de dados"],
  ["filtragem", "Filtragem de preços"],
  ["retorno", "Retorno de recursos"],
  ["esconderijos", "Esconderijos"],
  ["taxa", "Taxa de estação"],
  ["impostos", "Impostos de mercado"],
  ["qualidades", "Equipamento e qualidades"],
  ["diarios", "Diários de trabalhador"],
  ["foco", "Foco e especialização"],
  ["montarias", "Montarias criadas"],
  ["prata", "Prata por dia"],
  ["limitacoes", "Limitações conhecidas"],
] as const;

export default function Pt() {
  return (
    <>
      <nav aria-label="Seções desta página" className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {SECTIONS.map(([id, label], i) => (
          <span key={id}>
            <a href={`#${id}`}>{label}</a>
            {i < SECTIONS.length - 1 && <span className="text-muted-foreground"> ·</span>}
          </span>
        ))}
      </nav>

      <p className="rounded-md border border-dashed border-border bg-card/40 px-3 py-2.5 text-sm">
        Esta metodologia também diz o que <strong>não</strong> sabemos -- veja{" "}
        <a href="#limitacoes">Limitações conhecidas</a> antes de confiar cegamente num número.
      </p>

      <h2 id="fontes">Fontes de dados</h2>
      <ul>
        <li>
          <strong>Preços:</strong> Albion Online Data Project (servidor Américas), atualizados a cada hora. As cidades reais usam o menor preço de
          venda; o Mercado Negro (só armas e armaduras) usa a maior oferta de compra.
        </li>
        <li>
          <strong>Volume:</strong> média diária dos últimos 30 dias, do dump diário do projeto.
        </li>
        <li>
          <strong>Receitas:</strong> extraídas dos arquivos oficiais do cliente (ao-bin-dumps).
        </li>
      </ul>

      <h2 id="filtragem">Filtragem de preços</h2>
      <p>
        Os preços enviados pela comunidade podem incluir anúncios falsos. Descartamos uma cotação quando ela está muito acima das demais: na
        ingestão, se uma venda de 100.000 ou mais passa de 20 vezes a mediana das outras cotações do item; no cálculo, com 3 ou mais cotações,
        cortamos as que ficam abaixo de 0,4 ou acima de 2,5 vezes a mediana. Os descartes aparecem no detalhe de cada linha.
      </p>

      <h2 id="retorno">Retorno de recursos</h2>
      <p>
        <code>Retorno = 1 − 1 / (1 + bônus)</code>. O bônus soma 18 % de base, +15 % se a cidade tem a especialidade de criação dessa categoria
        (+40 % no refino) e +59 % com foco. Artefatos nunca têm retorno, nem o que a própria receita do jogo marca como não retornável: o animal
        adulto de uma montaria ou as fichas de Avalon.
      </p>

      <h2 id="esconderijos">Esconderijos</h2>
      <p>Na calculadora e nos rankings você pode escolher criar num esconderijo em vez de uma cidade. Num esconderijo não há 18 % de base:</p>
      <ul>
        <li>
          A criação soma o bônus geral do <strong>nível de poder</strong> (0 % no nível 1 até 26 % no nível 9).
        </li>
        <li>
          Se o item for especialidade do esconderijo, soma também o bônus da <strong>qualidade da zona</strong> (1 % em Q1 até 26 % em Q6) e o
          bônus de <strong>especialista do nível de poder</strong> (até 30 %).
        </li>
        <li>
          As especialidades de cada bioma são as mesmas cinco da sua cidade (pântano = Thetford, floresta = Lymhurst, estepe = Bridgewatch,
          planalto = Martlock, montanha = Fort Sterling). Nas estradas de Avalon cada estrada tem as suas, então isso é indicado à mão na
          calculadora; o ranking não as soma.
        </li>
        <li>O refino num esconderijo tem um bônus fixo, 15 % na zona negra e 10 % nas estradas (+10 % no recurso da estrada), que o nível de poder não muda.</li>
      </ul>
      <p>
        Os valores vêm do dump do jogo (hideouts.xml e craftingmodifiers.xml) e batem com a wiki oficial e as notas de patch; que a culinária e a
        alquimia recebem o bônus geral do nível de poder nós assumimos, porque nas cidades o mesmo bônus de criação as cobre, mas não verificamos
        no jogo.
      </p>

      <h2 id="taxa">Taxa de estação</h2>
      <p>
        <code>Nutrição consumida = valor do item × 0,1125</code>. <code>Custo = (nutrição / 100) × taxa da estação</code> (500 por padrão,
        editável). O valor do item soma o valor dos materiais que não são artefatos, segundo os dados do jogo.
      </p>

      <h2 id="impostos">Impostos de mercado</h2>
      <p>
        Descontamos um imposto de venda de 4 % com premium (8 % sem premium) mais 2,5 % de taxa de publicação. Essas porcentagens foram
        verificadas no jogo.
      </p>

      <h2 id="qualidades">Equipamento e qualidades</h2>
      <p>
        O preço de venda pondera as cinco qualidades com os pesos base do jogo, contando só as que têm liquidez real (volume e dias com vendas).
        Não modelamos o efeito do foco, da comida nem do Painel de Destino sobre a qualidade, porque essa fórmula não é pública.
      </p>

      <h2 id="diarios">Diários de trabalhador</h2>
      <p>Criar equipamento enche diários de trabalhador, um por família de item:</p>
      <ul>
        <li>
          <strong>Ferreiro:</strong> placas, espadas, machados, maças, martelos, bestas e manoplas.
        </li>
        <li>
          <strong>Flecheiro:</strong> couro, arcos, adagas, lanças, bastões de combate, cajados da natureza e metamorfos.
        </li>
        <li>
          <strong>Imbuidor:</strong> tecido e cajados de fogo, gelo, arcano, sagrado e amaldiçoado.
        </li>
        <li>
          <strong>Funileiro:</strong> ferramentas, capas, bolsas e equipamento de coleta.
        </li>
      </ul>
      <p>
        O diário precisa ser do mesmo tier do item. Por padrão somamos esse ganho: você compra o diário vazio na cidade mais barata, enche e
        vende cheio pelo preço de referência, com o mesmo imposto do item. A fama de uma criação é{" "}
        <code>recursos refinados da receita × fama por recurso do tier</code> (22,5 no T4, 90 no T5, 270 no T6, 645 no T7, 1.395 no T8; dobra a
        cada encantamento) <code>× fator próprio do item nos artefatos</code> (1,1 a 1,4). Artefatos não somam fama, o bônus de premium não enche
        diários, e o foco e a qualidade não mudam a fama. Qual item enche qual diário e quanta fama entra em cada um vêm do dump do jogo. Refino,
        alquimia e culinária não enchem nenhum diário.
      </p>

      <h2 id="foco">Foco e especialização</h2>
      <p>
        <code>Foco de uma criação = foco base × 0,5 ^ (eficiência / 10.000)</code>: cada 10.000 de eficiência de custo de foco o reduz pela
        metade. A eficiência vem do seu Painel de Destino: cada nível de maestria soma 30 a toda a categoria, cada nível da especialização de um
        item soma 250 a esse item, e as outras especializações da categoria somam entre 11,25 e 30 por nível (conforme o nó; as de cristal, cerca
        de 2 a toda a árvore). No refino, cada tier é um nó: 250 para o próprio tier e 30 para todos os tiers desse recurso. Os valores por nível
        e a quais itens se aplicam vêm do dump do jogo (Painel de Destino), e o resultado bate com o que o jogo cobra. O foco base do jogo é por
        unidade produzida: uma criação de 5 poções custa 5 vezes o foco de uma. O jogo arredonda o total do pedido, não cada criação. As
        montarias não têm nós que reduzam o foco.
      </p>

      <h2 id="montarias">Montarias criadas</h2>
      <p>Nas montarias você pode escolher criar o animal base em vez de comprá-lo adulto:</p>
      <ul>
        <li>
          <strong>Cavalo e boi (T3 a T8):</strong> o filhote tem preço fixo no Mercador da Fazenda (25.000 no T3, e triplica por tier até
          6.075.000 no T8).
        </li>
        <li>
          <strong>Veado gigante, alce, lobo atroz, javali, urso, dragão do pântano e mamute:</strong> o filhote não tem preço fixo, então é
          cotado no mercado como qualquer material.
        </li>
        <li>Some-se a isso a comida: o cultivo ou a carne mais barata do dia, pelas unidades necessárias para ele crescer (segundo os dados do jogo).</li>
        <li>
          Cavalo e boi, ao crescer, devolvem um filhote novo com chance de 78 a 87 % conforme o tier, então o filhote conta só pela parte que não
          volta (no T4, 75.000 × 21 % ≈ 16.000); as outras famílias não devolvem filhotes.
        </li>
      </ul>
      <p>
        Criar leva de 44 h (T3) a 284 h (T8), e a prata por dia não desconta essa espera. Cuidar do animal com foco aumenta a chance de filhote,
        mas não modelamos isso porque não verificamos no jogo. Ficam de fora o Draco Asa-de-Fogo e o Coelho da Primavera, que não têm um custo
        que possamos calcular com dados reais.
      </p>

      <h2 id="prata">Prata por dia</h2>
      <p>
        <code>Lucro por unidade × volume diário × fatia de mercado assumida</code> (10 % por padrão). É uma estimativa, não uma garantia.
      </p>

      <h2 id="limitacoes">Limitações conhecidas</h2>
      <ul>
        <li>O foco com sua especialização é calculado na calculadora, mas o ranking ainda não ordena por prata por ponto de foco.</li>
        <li>O Mercado Negro aceita qualidades iguais ou maiores que a pedida e não modelamos isso: só contamos a qualidade exata.</li>
        <li>Não modelamos a rerrolagem de qualidade.</li>
        <li>O volume de venda dos diários cheios não limita a prata/dia: assumimos que vendem no ritmo do item.</li>
        <li>Os dados dependem de jogadores enviarem ao projeto; itens pouco negociados podem ter preços antigos.</li>
      </ul>
    </>
  );
}
