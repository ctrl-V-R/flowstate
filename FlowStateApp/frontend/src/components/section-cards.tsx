import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardDescription, CardTitle, CardAction, CardFooter } from "@/components/ui/card"
import type { Metric } from "@/types"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

export function SectionCards({ data }: { data?: Metric[] }) {
  if (!data) return null

  return (
    <div className="grid grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {data.map((item, index) => {
        const isPositive = !item.trend.includes("-")
        const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon

        return (
          <Card key={index} className="@container/card">
            <CardHeader>
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {item.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={isPositive ? "text-emerald-500" : "text-destructive"}>
                  <Icon className="mr-1 size-3" />
                  {item.trend}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {isPositive ? "Trending up" : "Down"} this period{" "}
                <Icon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {item.description || "System synchronized"}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}