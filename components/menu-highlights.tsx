import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MenuHighlights() {
  const popularDishes = [
    { name: "Grilled Chicken Salad", sold: 42 },
    { name: "Vegetable Stir Fry", sold: 36 },
    { name: "Beef Lasagna", sold: 29 },
    { name: "Fresh Fruit Smoothie", sold: 24 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Menu Highlights</CardTitle>
        <p className="text-sm text-muted-foreground">Most popular dishes today</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {popularDishes.map((dish) => (
            <div key={dish.name} className="flex justify-between items-center">
              <span className="font-medium">{dish.name}</span>
              <span className="text-sm text-muted-foreground">{dish.sold} sold</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
