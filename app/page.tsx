export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 gap-8">
        <h1 className="text-4xl font-bold text-black dark:text-white text-center">
          PatternPal
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-lg">
          Generate structured garment construction guidance for your sewing projects.
        </p>
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-500">
          Home page under development. Form and results UI coming soon.
        </div>
      </main>
    </div>
  );
}
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
