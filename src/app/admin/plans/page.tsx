
'use client';

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, MoreHorizontal, Trash2 } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Plan {
    id: string;
    name: string;
    price: number;
    target: string;
    features: string[];
    popular: boolean;
}

interface UserProfile {
    isAdmin?: boolean;
}

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  target: z.string().min(1, "Target is required."),
  features: z.string().min(1, "Please list at least one feature."),
  popular: z.boolean().default(false),
});

type PlanFormData = z.infer<typeof planSchema>;

function PlanForm({ plan, onSave, onCancel }: { plan?: Plan | null, onSave: () => void, onCancel: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name || '',
      price: plan?.price || 0,
      target: plan?.target || '',
      features: plan?.features?.join('\n') || '',
      popular: plan?.popular || false,
    },
  });

  const onSubmit = async (data: PlanFormData) => {
    if (!firestore) return;
    try {
      if (plan) {
        // Update existing plan
        const planRef = doc(firestore, 'plans', plan.id);
        await updateDoc(planRef, { ...data, features: data.features.split('\n') });
        toast({ title: "Success", description: "Plan updated successfully." });
      } else {
        // Create new plan
        await addDoc(collection(firestore, 'plans'), {
          ...data,
          features: data.features.split('\n'),
          createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "New plan created." });
      }
      onSave();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save the plan." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="plan-name">Plan Name</Label>
        <Input id="plan-name" placeholder="e.g., Pro" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="plan-price">Annual Price (USD)</Label>
          <Input id="plan-price" type="number" placeholder="e.g., 999" {...register("price")} />
          {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="plan-target">Monthly Target Range</Label>
          <Input id="plan-target" placeholder="e.g., 20% to 50%" {...register("target")} />
          {errors.target && <p className="text-destructive text-sm">{errors.target.message}</p>}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea id="features" placeholder="Enter one feature per line." {...register("features")} />
        {errors.features && <p className="text-destructive text-sm">{errors.features.message}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <Controller
          name="popular"
          control={control}
          render={({ field }) => (
            <Checkbox id="plan-popular" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="plan-popular">Mark as "Most Popular"?</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Plan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminPlansPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', adminUser?.uid);

  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);


  const plansQuery = useMemo(() => {
    // Anyone can read plans, but we only want admins to trigger the form.
    // However, the `useCollection` will still fire.
    // For admin pages, let's keep it safe and only query if admin.
    if (!firestore || !userProfile?.isAdmin) return null;
    return query(collection(firestore, 'plans'));
  }, [firestore, userProfile?.isAdmin]);

  const { data: plans, loading: plansLoading } = useCollection<Plan>(plansQuery);

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!firestore || !deletingPlan) return;
    const planRef = doc(firestore, 'plans', deletingPlan.id);
    try {
        await deleteDoc(planRef)
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: planRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError; // Re-throw to be caught by the outer catch
        });

      toast({ title: "Plan Deleted", description: `The '${deletingPlan.name}' plan has been deleted.` });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete the plan. Check console for errors." });
    } finally {
        setDeletingPlan(null);
    }
  };

  const closeForm = () => setIsFormOpen(false);

  const loading = profileLoading || plansLoading;

  return (
    <AdminShell title="Subscription Plan Management">
        <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{deletingPlan?.name}</strong> plan.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage the subscription plans available to users.</CardDescription>
            </div>
            <Button onClick={handleCreate} disabled={!userProfile?.isAdmin}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Plan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Annual Price</TableHead>
                  <TableHead>Monthly Target</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading plans...</TableCell></TableRow>
                ) : plans && plans.length > 0 ? (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name} {plan.popular && <span className="text-primary text-xs ml-2">(Popular)</span>}</TableCell>
                      <TableCell>${plan.price}</TableCell>
                      <TableCell>{plan.target}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!userProfile?.isAdmin}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(plan)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingPlan(plan)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No plans configured.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? "Update the details for this plan." : "Fill out the details for the new plan."}
            </DialogDescription>
          </DialogHeader>
          <PlanForm plan={selectedPlan} onSave={closeForm} onCancel={closeForm} />
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
