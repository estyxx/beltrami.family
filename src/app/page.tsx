export default function Home() {
	return (
		<div className="container mx-auto">
			<main className="flex flex-col content-center">
				<div>
					<h1 className="font-serif text-xl text-center font-bold">
						Benvenuto nell&apos;Albero di Famiglia!
					</h1>
					<div className="flex flex-wrap justify-center w-full">
						<div className="w-6/12 px-4 sm:w-4/12">
							{/* Uncomment and update this Image component as needed */}
							{/*
                <Image
                  src="/family.jpg"
                  alt="Beltrami Family"
                  layout="fill"
                  objectFit="contain"
                  width={500}
                  height={200}
                />
                */}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
