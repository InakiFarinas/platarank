import Link from "next/link";
import { localePath } from "@/i18n/config";
import { DISCORD_URL } from "@/lib/seo";

export default function Pt() {
  return (
    <>
      <p>
        PlataRank é uma ferramenta gratuita feita pela comunidade de Albion Online. Ela ordena as receitas de criação pela prata que rendem por dia
        (lucro por unidade × volume de vendas), para que você decida o que criar com dados e não por intuição.
      </p>
      <h2>De onde vêm os dados</h2>
      <ul>
        <li>Preços e volumes: Albion Online Data Project, alimentado por jogadores, servidor Américas. Atualizados a cada hora.</li>
        <li>Receitas e valores de itens: dump oficial do cliente do jogo.</li>
        <li>
          Todas as fórmulas estão explicadas na <Link href={localePath("pt", "methodology")}>metodologia</Link>, incluindo suas limitações.
        </li>
      </ul>
      <h2>Contato</h2>
      <p>
        O jeito mais rápido de relatar um erro ou sugerir uma melhoria é o{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
          Discord da comunidade
        </a>
        .
      </p>
      <h2>Sem afiliação</h2>
      <p>PlataRank não é afiliada à Sandbox Interactive nem ao Albion Online. É um uso não oficial e com fins informativos.</p>
    </>
  );
}
