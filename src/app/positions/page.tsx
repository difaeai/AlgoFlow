
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBotContext } from "@/context/bot-provider";
import { cn } from "@/lib/utils";

export default function PositionsContent() {
  const { isBotActive } = useBotContext();
  const positions: any[] = [];

  return (
       <Card className={cn(
            "border-accent/50 shadow-lg shadow-accent/20",
            isBotActive && "animated-grid"
        )}>
        {isBotActive && <div className="scanner-line !bg-gradient-to-r from-transparent via-accent/80 to-transparent" style={{animationDuration: '3s'}}></div>}
        <CardHeader className="relative z-10">
          <CardTitle className="font-headline text-accent">Executor</CardTitle>
          <CardDescription>
            Live positions being managed by the Executor bot.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Avg. Price</TableHead>
                <TableHead className="text-right">Unrealized PnL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {positions.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No open positions.
                        </TableCell>
                    </TableRow>
                ) : positions.map(pos => (
                    <TableRow key={pos.symbol} className={cn(isBotActive && "pulse-glow-intense")}>
                        <TableCell className="font-medium">{pos.symbol}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={pos.side === 'Long' ? 'text-green-500 border-green-500' : 'text-red-500 border-red-500'}>
                                {pos.side}
                            </Badge>
                        </TableCell>
                        <TableCell>{pos.qty}</TableCell>
                        <TableCell>${pos.avgPrice.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-medium ${pos.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${pos.unrealizedPnl.toFixed(2)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}
