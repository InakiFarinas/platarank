/** Communities that advertise on PlataRank, shown in the home page's "Comunidades que nos apoyan"
 * section. Add one entry per community; `src` is an optional square icon in `public/comunidades/`.
 * `descriptionKey` is a key under `stations.sponsors` (the one-line description, per locale). While
 * the list is empty the section shows the invitation to advertise instead. */
export const COMMUNITY_SPONSORS: { name: string; descriptionKey: string; href: string; src?: string }[] = [
  { name: "Avalon", descriptionKey: "avalonDesc", href: "https://discord.gg/xHrRDbtgtn", src: "/comunidades/avalon.png" },
  { name: "El panteón del rastreo", descriptionKey: "panteonDesc", href: "https://discord.gg/jWmJHJvWut", src: "/comunidades/panteon-del-rastreo.png" },
];
