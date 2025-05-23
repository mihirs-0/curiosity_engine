import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResultCardProps {
  id: string
  title: string
  highlights?: string[]
  links?: {
    title: string
    url: string
    description: string
  }[]
  className?: string
}

export default function ResultCard({ id, title, highlights, links, className }: ResultCardProps) {
  return (
    <Card className={cn("h-full shadow-md hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <Link href={`/result/${id}`}>
          <CardTitle className="text-xl hover:text-amber-600 transition-colors">{title}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlights && highlights.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Highlights:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              {highlights.slice(0, 3).map((highlight, index) => (
                <li key={index} className="line-clamp-1">
                  {highlight}
                </li>
              ))}
              {highlights.length > 3 && (
                <li className="text-amber-600 font-medium">
                  <Link href={`/result/${id}`}>+{highlights.length - 3} more highlights</Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {links && links.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Resources:</h3>
            <ul className="text-sm space-y-1">
              {links.slice(0, 2).map((link, index) => (
                <li key={index} className="flex items-start">
                  <ExternalLink className="h-3 w-3 mr-1 mt-1 flex-shrink-0 text-gray-400" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline line-clamp-1"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
              {links.length > 2 && (
                <li className="text-amber-600 font-medium text-sm">
                  <Link href={`/result/${id}`}>+{links.length - 2} more resources</Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/result/${id}`} className="text-sm text-amber-600 hover:text-amber-800 font-medium">
          View full details →
        </Link>
      </CardFooter>
    </Card>
  )
}
