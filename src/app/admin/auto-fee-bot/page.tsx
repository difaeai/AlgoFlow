
'use client';

import { AdminShell } from "../_components/admin-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, addDoc, serverTimestamp, query } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useToast } from "@/hooks/use-toast";


interface User {
    id: string;
    displayName: string;
    email: string;
    profitShare?: number;
    planId?: string;
    isAdmin?: boolean;
}

interface UserProfile {
    isAdmin?: boolean;
}

interface Simulation {
    id: string;
    userName: string;
    userEmail: string;
    monthlyProfit: number;
    calculatedFee: number;
    simulationDate: { seconds: number };
}
  
function FeeSimulator({ users, loading, onSimulate }) {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [monthlyProfit, setMonthlyProfit] = useState<number | undefined>();

  const usersForBot = useMemo(() => users?.filter(u => !u.isAdmin) || [], [users]);
  const selectedUser = usersForBot.find(u => u.id === selectedUserId);

  const calculatedFee = useMemo(() => {
    if (!selectedUser || !monthlyProfit) return 0;
    const profitShare = selectedUser.profitShare ?? 3.5;
    return (monthlyProfit * profitShare) / 100;
  }, [selectedUser, monthlyProfit]);

  const handleSimulate = () => {
    if (selectedUser && monthlyProfit) {
        onSimulate({
            userName: selectedUser.displayName || selectedUser.email,
            userEmail: selectedUser.email,
            monthlyProfit: monthlyProfit,
            calculatedFee: calculatedFee,
        });
    }
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Deduction Simulator</CardTitle>
        <CardDescription>
          Simulate the automated profit-sharing fee deduction process for a
          user.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <Select onValueChange={setSelectedUserId} value={selectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder={loading ? "Loading users..." : "Select a user to run simulation"} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : usersForBot.length > 0 ? (
                    usersForBot.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                    </SelectItem>
                    ))
                ) : (
                    <SelectItem value="no-users" disabled>No users found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-profit-share">Profit Share %</Label>
            <div className="flex items-center gap-2">
                <Input id="user-profit-share" value={selectedUser ? `${selectedUser.profitShare ?? 3.5}%` : 'N/A'} disabled />
                {selectedUser && <Badge variant="outline">{selectedUser.planId || 'N/A'}</Badge>}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="monthly-profit">Monthly Profit (USD)</Label>
                <Input 
                    id="monthly-profit" 
                    type="number" 
                    placeholder="e.g., 1250" 
                    value={monthlyProfit || ''}
                    onChange={(e) => setMonthlyProfit(Number(e.target.value))}
                    disabled={!selectedUser}
                />
            </div>
            <div className="space-y-2">
                <Label>Calculated Fee</Label>
                <p className="text-2xl font-bold font-headline">${calculatedFee.toFixed(2)}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSimulate} disabled={!selectedUser || !monthlyProfit}>Simulate Deduction & Log</Button>
      </CardFooter>
    </Card>
  );
}

function SimulationHistory({ simulations, loading }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Simulation Log</CardTitle>
                <CardDescription>A history of all simulated fee deductions.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Monthly Profit</TableHead>
                  <TableHead>Calculated Fee</TableHead>
                  <TableHead>Simulation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                 ) : !simulations || simulations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No simulation history.
                    </TableCell>
                  </TableRow>
                 ) : (
                    simulations.map((sim) => (
                        <TableRow key={sim.id}>
                            <TableCell>
                                <div className="font-medium">{sim.userName}</div>
                                <div className="text-xs text-muted-foreground">{sim.userEmail}</div>
                            </TableCell>
                            <TableCell>${sim.monthlyProfit.toFixed(2)}</TableCell>
                            <TableCell>${sim.calculatedFee.toFixed(2)}</TableCell>
                            <TableCell>{new Date(sim.simulationDate.seconds * 1000).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))
                 )}
              </TableBody>
            </Table>
            </CardContent>
        </Card>
    )
}

export default function AutoFeeBotPage() {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', adminUser?.uid);
    const { toast } = useToast();

    const usersQuery = useMemo(() => {
        if (!firestore || !userProfile?.isAdmin) return null;
        return collection(firestore, 'users');
    }, [firestore, userProfile?.isAdmin]);

    const simulationsQuery = useMemo(() => {
        if (!firestore || !userProfile?.isAdmin) return null;
        // This should probably be its own top-level collection
        return query(collection(firestore, 'simulations'));
    }, [firestore, userProfile?.isAdmin]);

    const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);
    const { data: simulations, loading: simulationsLoading } = useCollection<Simulation>(simulationsQuery);

    const handleSimulate = async (simulationData: Omit<Simulation, 'id' | 'simulationDate'>) => {
        if (!firestore) return;
        try {
            await addDoc(collection(firestore, 'simulations'), {
                ...simulationData,
                simulationDate: serverTimestamp(),
            });
            toast({ title: "Simulation Logged", description: "The fee deduction simulation has been logged." });
        } catch (error) {
            console.error("Error logging simulation:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not log the simulation." });
        }
    };
    
    const loading = profileLoading || usersLoading || simulationsLoading;

  return (
    <AdminShell title="Auto-Fee Bot">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <FeeSimulator users={users} loading={loading} onSimulate={handleSimulate} />
        </div>
        <div className="lg:col-span-2">
            <SimulationHistory simulations={simulations} loading={loading} />
        </div>
      </div>
    </AdminShell>
  );
}
