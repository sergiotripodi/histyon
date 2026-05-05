import Image from 'next/image'

interface LogoProps {
  color?: 'black' | 'white'
  className?: string
}

export function Logo({ color = 'black', className }: LogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image 
        src={color === 'black' ? '/logo-black.png' : '/logo-white.png'} 
        alt="Histyon Logo" 
        width={150} 
        height={50}
        className="object-contain h-16 w-auto" 
        priority
      />
    </div>
  )
}