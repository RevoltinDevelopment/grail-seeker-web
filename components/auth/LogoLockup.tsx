import Image from 'next/image'

interface LogoLockupProps {
  className?: string
}

export function LogoLockup({ className = '' }: LogoLockupProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Image
        src="/images/grail-seeker-transparent.png"
        alt="Grail Seeker"
        width={64}
        height={64}
        className="mb-2"
        priority
      />
      <h1 className="font-cinzel text-xl font-semibold tracking-wider text-collector-navy">
        GRAIL SEEKER
      </h1>
    </div>
  )
}
