export default function En() {
  return (
    <>
      <p>PlataRank is a free tool for calculating crafting profitability in Albion Online. Here we explain what data we process.</p>

      <h2>Data we receive</h2>
      <p>
        <strong>Without an account:</strong> you can use the rankings and the calculator without signing up. Our servers may log standard
        technical data (IP address, browser, pages visited) to operate and protect the service.
      </p>
      <p>
        <strong>With a Discord account:</strong> if you choose &quot;Sign in with Discord&quot;, we receive your identifier, username, avatar and
        email address from Discord. We use them only to identify you and show your session. We do not access your messages, servers or friends.
      </p>
      <p>
        <strong>Plans:</strong> the calculations you save (item, quantities, prices you edit and the result) are stored linked to your account and
        only you can see them.
      </p>

      <p>
        <strong>Discord alerts:</strong> if you enable alerts, we store the webhook URL you give us and the threshold of each alert. We use that
        URL only to send you your alerts, and you can remove it at any time from Plans.
      </p>

      <h2>Cookies and storage</h2>
      <ul>
        <li>Session cookies needed to keep you signed in if you log in.</li>
        <li>Local browser preferences (for example filters and the selected city).</li>
      </ul>
      <p>If third-party ads are shown in the future, they may use their own cookies; in that case we will ask for your consent where applicable.</p>

      <h2>Who we share data with</h2>
      <p>
        We do not sell your data. We use <strong>Supabase</strong> (authentication and database) and <strong>Discord</strong> (sign-in) as
        providers, along with the hosting service where the site is published.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to or deletion of your account and your plans by writing on Discord: <strong>inaki261111</strong>. You can delete
        your plans at any time from the calculator.
      </p>
    </>
  );
}
