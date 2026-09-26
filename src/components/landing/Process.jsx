const STEPS = [
  { n: '01', title: 'Choose a platform', text: 'Road, city or BMX — each rendered from its real production model.' },
  { n: '02', title: 'Shape every finish', text: 'Paint, finish, rims, tyres, cockpit and accessories update instantly in 3D.' },
  { n: '03', title: 'Share the exact build', text: 'Send it on WhatsApp or e-mail, or share a link that reopens your build.' },
];

export default function Process() {
  return (
    <section id="process" className="process" aria-labelledby="process-title">
      <div className="section-head">
        <p className="eyebrow">How it works</p>
        <h2 id="process-title" className="section-title">
          From idea to
          <br />
          your build in minutes.
        </h2>
      </div>
      <ol className="process__list">
        {STEPS.map((s) => (
          <li key={s.n} className="process__step">
            <span className="process__n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
