export default function Pt() {
  return (
    <>
      <p>PlataRank é uma ferramenta gratuita para calcular a rentabilidade de criação em Albion Online. Aqui explicamos quais dados tratamos.</p>

      <h2>Dados que recebemos</h2>
      <p>
        <strong>Sem conta:</strong> você pode usar os rankings e a calculadora sem se registrar. Os servidores podem registrar dados técnicos
        padrão (endereço IP, navegador, páginas visitadas) para operar e proteger o serviço.
      </p>
      <p>
        <strong>Com conta do Discord:</strong> se você escolher &quot;Entrar com o Discord&quot;, recebemos do Discord seu identificador, nome de
        usuário, avatar e e-mail. Usamos esses dados só para identificar você e mostrar sua sessão. Não acessamos suas mensagens, servidores nem
        amigos.
      </p>
      <p>
        <strong>Planejamentos:</strong> os cálculos que você salvar (item, quantidades, preços editados e o resultado) ficam armazenados na sua
        conta e só você pode vê-los.
      </p>

      <p>
        <strong>Avisos pelo Discord:</strong> se você ativar alertas, guardamos a URL do webhook que você informar e o limite de cada alerta.
        Usamos essa URL apenas para enviar seus avisos, e você pode removê-la quando quiser em Planejamentos.
      </p>

      <h2>Cookies e armazenamento</h2>
      <ul>
        <li>Cookies de sessão necessários para manter você conectado se fizer login.</li>
        <li>Preferências locais do navegador (por exemplo filtros e cidade escolhida).</li>
      </ul>
      <p>Se no futuro forem exibidos anúncios de terceiros, eles poderão usar cookies próprios; nesse caso pediremos seu consentimento onde for necessário.</p>

      <h2>Com quem compartilhamos dados</h2>
      <p>
        Não vendemos seus dados. Usamos <strong>Supabase</strong> (autenticação e banco de dados) e <strong>Discord</strong> (login) como
        fornecedores, além do serviço de hospedagem onde o site é publicado.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso ou a exclusão da sua conta e dos seus planejamentos escrevendo no Discord para <strong>inaki261111</strong>. Você
        pode apagar seus planejamentos a qualquer momento pela calculadora.
      </p>
    </>
  );
}
