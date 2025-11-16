import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";


export default function HistoryPage() {
  return (
    <DashboardShell title="Profit History">
      <Tabs defaultValue="orders">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="fees">Fee Invoices</TabsTrigger>
          <TabsTrigger value="referrals">Referral Status</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>A log of all your past trades.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Realized PnL</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No order history yet.
                        </TableCell>
                    </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="statements">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Statements</CardTitle>
                    <CardDescription>Download your monthly performance statements in PDF format.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <p>No statements available.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="fees">
            <Card>
                <CardHeader>
                <CardTitle>Fee Invoices</CardTitle>
                <CardDescription>History of your 3.5% profit-sharing fee payments.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">No fee invoices yet.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="referrals">
             <Card>
                <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>Status of users you've referred.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You haven't referred anyone yet.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
