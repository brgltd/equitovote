export function Footer() {
  return (
    // <footer className="border-t-red-500">
    // <footer className="border-t-gray-400">
    // <footer className="border border-t-gray-400">
    <footer className="border border-t-gray-400 flex flex-row justify-between">
      <div>© {new Date().getFullYear()} EquitoVote</div>
      <div>
        <a href="https://github.com/brgltd/equitovote" target="_blank">
          Source Code
        </a>
        <a href="">Powered by Equito Network</a>
      </div>
    </footer>
  );
}
