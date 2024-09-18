export function Footer() {
  return (
    <footer
      style={{
        color: "rgb(108, 134, 173)",
        borderTop: "1px solid rgba(156, 163, 175, 0.3)",
      }}
      className="flex sm:flex-row flex-col sm:justify-between text-sm my-12 pt-4 gap-6"
    >
      <div>© {new Date().getFullYear()} EquitoVote</div>
      <div>
        <a
          href="https://github.com/brgltd/equitovote"
          target="_blank"
          className="underline mr-8"
        >
          Source Code
        </a>
        <a
          href="https://www.equito.network"
          target="_blank"
          className="underline"
        >
          Powered by Equito Network
        </a>
      </div>
    </footer>
  );
}
