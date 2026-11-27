export default function StoreProfileCoverArt() {
  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="storeCoverWall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2317" />
          <stop offset="0.45" stopColor="#8c5734" />
          <stop offset="1" stopColor="#d5a06b" />
        </linearGradient>
        <radialGradient id="storeCoverLight" cx="50%" cy="50%" r="50%">
          <stop stopColor="#ffe6ae" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffe6ae" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="storeCoverTable" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#6d452b" />
          <stop offset="1" stopColor="#2a170e" />
        </linearGradient>
        <linearGradient id="storeCoverCake" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f7e5c2" />
          <stop offset="1" stopColor="#d7ad72" />
        </linearGradient>
        <linearGradient id="storeCoverBox" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f2e3cc" />
          <stop offset="1" stopColor="#d5b58d" />
        </linearGradient>
      </defs>

      <rect width="1200" height="320" fill="url(#storeCoverWall)" />
      <circle cx="950" cy="40" r="260" fill="url(#storeCoverLight)" />
      <circle cx="240" cy="36" r="190" fill="url(#storeCoverLight)" opacity="0.4" />
      <circle cx="1080" cy="120" r="90" fill="url(#storeCoverLight)" opacity="0.45" />

      {/* Rak belakang dan stoples kaca */}
      <rect x="70" y="38" width="360" height="9" rx="4" fill="#3b2417" opacity="0.65" />
      <g opacity="0.75">
        <rect x="112" y="82" width="36" height="54" rx="8" fill="#c8a06f" opacity="0.55" />
        <rect x="116" y="72" width="28" height="12" rx="4" fill="#8a5a34" />
        <rect x="172" y="90" width="30" height="46" rx="7" fill="#e2c396" opacity="0.55" />
        <rect x="176" y="80" width="22" height="12" rx="4" fill="#8a5a34" />
        <rect x="228" y="78" width="42" height="58" rx="9" fill="#d5ad7a" opacity="0.5" />
        <rect x="234" y="67" width="30" height="13" rx="4" fill="#7c4a2a" />
        <rect x="300" y="92" width="26" height="44" rx="6" fill="#f0dcb8" opacity="0.5" />
      </g>

      {/* Lampu gantung */}
      <g opacity="0.85">
        <line x1="760" y1="0" x2="760" y2="44" stroke="#3b2417" strokeWidth="4" />
        <path d="M732 44 h56 l-10 26 h-36 z" fill="#e8c78f" />
        <circle cx="760" cy="80" r="9" fill="#ffe8b0" />
        <line x1="1040" y1="0" x2="1040" y2="36" stroke="#3b2417" strokeWidth="4" />
        <path d="M1014 36 h52 l-9 23 h-34 z" fill="#e8c78f" />
        <circle cx="1040" cy="68" r="8" fill="#ffe8b0" />
      </g>

      <rect x="0" y="222" width="1200" height="98" fill="url(#storeCoverTable)" />
      <rect x="0" y="215" width="1200" height="9" fill="#8a5c38" />

      {/* Kue lapis di stand kiri */}
      <g>
        <ellipse cx="300" cy="238" rx="128" ry="16" fill="#1b100b" opacity="0.42" />
        <rect x="284" y="208" width="32" height="26" fill="#d8c3a5" />
        <ellipse cx="300" cy="208" rx="82" ry="15" fill="#f4e6cd" />
        <rect x="256" y="152" width="88" height="56" rx="8" fill="url(#storeCoverCake)" />
        <rect x="256" y="160" width="88" height="8" fill="#b07a43" opacity="0.45" />
        <rect x="256" y="176" width="88" height="8" fill="#b07a43" opacity="0.4" />
        <rect x="256" y="192" width="88" height="8" fill="#b07a43" opacity="0.35" />
        <path d="M252 152 h96 l-8 -10 h-80 z" fill="#fdf4e2" />
        <circle cx="288" cy="137" r="8" fill="#b91c1c" />
        <circle cx="316" cy="141" r="6" fill="#7c2d12" opacity="0.75" />
        <path d="M300 134 q7 -13 0 -21" stroke="#5b7c3a" strokeWidth="3" fill="none" />
      </g>

      {/* Aneka pastry di tengah */}
      <g>
        <ellipse cx="610" cy="241" rx="150" ry="17" fill="#1b100b" opacity="0.4" />
        <ellipse cx="610" cy="232" rx="132" ry="15" fill="#efe0c8" />
        <ellipse cx="566" cy="224" rx="34" ry="13" fill="#e7b26a" />
        <ellipse cx="610" cy="218" rx="41" ry="15" fill="#f0c785" />
        <ellipse cx="654" cy="224" rx="30" ry="12" fill="#dba15a" />
        <circle cx="610" cy="208" r="6" fill="#9a3412" opacity="0.7" />
        <circle cx="640" cy="214" r="5" fill="#9a3412" opacity="0.55" />
        <circle cx="580" cy="215" r="4" fill="#9a3412" opacity="0.55" />
      </g>

      {/* Hampers kanan dengan pita */}
      <g>
        <ellipse cx="945" cy="246" rx="172" ry="17" fill="#1b100b" opacity="0.4" />
        <rect x="812" y="158" width="118" height="86" rx="6" fill="url(#storeCoverBox)" />
        <rect x="864" y="158" width="14" height="86" fill="#7f9db3" />
        <path d="M864 158 q-24 -24 -6 -38 q20 -6 13 38" fill="#9cb6c9" />
        <path d="M878 158 q24 -24 6 -38 q-20 -6 -13 38" fill="#9cb6c9" />
        <rect x="936" y="128" width="126" height="116" rx="6" fill="#d9c3a6" />
        <rect x="990" y="128" width="15" height="116" fill="#c0a07c" opacity="0.8" />
        <path d="M990 128 q-27 -30 -3 -44 q23 -4 10 44" fill="#d8c2a4" />
        <path d="M1005 128 q27 -30 3 -44 q-23 -4 -10 44" fill="#d8c2a4" />
        <rect x="936" y="170" width="126" height="10" fill="#b9956f" opacity="0.4" />
      </g>

      {/* Bunga dan daun dekorasi */}
      <g opacity="0.85">
        <circle cx="740" cy="238" r="9" fill="#f6ded0" />
        <circle cx="758" cy="230" r="7" fill="#f0cbb8" />
        <circle cx="724" cy="230" r="7" fill="#f7e6da" />
        <path d="M740 244 q-20 12 -40 2" stroke="#4d6b3a" strokeWidth="4" fill="none" />
      </g>

      <rect width="1200" height="320" fill="#2b160d" opacity="0.08" />
    </svg>
  )
}
