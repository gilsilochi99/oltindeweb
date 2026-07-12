
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createProcedure, updateProcedure } from "@/lib/actions";
import { Procedure, Institution } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, PlusCircle, Trash2, Upload } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const procedureStepSchema = z.object({
  step: z.coerce.number().int().min(1),
  description: z.string().min(3, "La descripción del paso es obligatoria."),
  location: z.string().min(3, "La ubicación es obligatoria."),
});

const documentSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "El nombre del documento es obligatorio."),
  url: z.string().min(1, "El archivo es obligatorio."),
  createdAt: z.string(),
});

const procedureFormSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  description: z.string().min(10, "La descripción es obligatoria."),
  category: z.string().min(3, "La categoría es obligatoria."),
  cost: z.string().min(1, "El costo es obligatorio."),
  institutionId: z.string({ required_error: "Debe seleccionar una institución." }),
  institution: z.string(), // This will be set based on institutionId
  requirements: z.array(z.string()).min(1, "Debe haber al menos un requisito."),
  steps: z.array(procedureStepSchema).min(1, "Debe haber al menos un paso."),
  documents: z.array(documentSchema).optional(),
});

type ProcedureFormValues = z.infer<typeof procedureFormSchema>;

interface ProcedureFormProps {
  type: 'Create' | 'Update';
  initialData?: Procedure;
  institutions: Institution[];
  categories: string[];
  onFormSubmit: () => void;
}

export function ProcedureForm({ type, initialData, institutions, categories, onFormSubmit }: ProcedureFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = initialData ? {
    ...initialData,
    steps: initialData.steps.sort((a,b) => a.step - b.step),
    documents: initialData.documents || [],
  } : {
    name: '',
    description: '',
    category: '',
    cost: '',
    institutionId: '',
    institution: '',
    requirements: [''],
    steps: [{ step: 1, description: '', location: '' }],
    documents: [],
  };

  const form = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: defaultValues,
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control: form.control,
    name: "requirements",
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: "steps",
  });
  
  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({
      control: form.control,
      name: "documents",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Archivo demasiado grande", description: "El archivo debe ser menor de 5MB.", variant: "destructive"});
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(`documents.${index}.url`, reader.result as string, { shouldDirty: true });
        if (!form.getValues(`documents.${index}.name`)) {
            form.setValue(`documents.${index}.name`, file.name, { shouldDirty: true });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: ProcedureFormValues) {
    setIsSubmitting(true);
    const selectedInstitution = institutions.find(inst => inst.id === values.institutionId);
    if (!selectedInstitution) {
        toast({ title: "Error", description: "Institución no válida.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    const finalValues = { ...values, institution: selectedInstitution.name };


    try {
      if (type === 'Create') {
        await createProcedure(finalValues);
        toast({ title: "Trámite Creado", description: "El nuevo trámite ha sido añadido." });
      } else if (initialData) {
        await updateProcedure(initialData.id, finalValues);
        toast({ title: "Trámite Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el trámite.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Trámite</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: Documentación" /></FormControl>
                <FormDescription>Puede ser una existente o nueva.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: 50.000 XAF o Variable" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="institutionId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Institución Responsable</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value ? institutions.find((inst) => inst.id === field.value)?.name : "Seleccione una institución"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar institución..." />
                        <CommandEmpty>No se encontró la institución.</CommandEmpty>
                        <CommandGroup>
                        <ScrollArea className="h-48">
                            {institutions.map((inst) => (
                            <CommandItem value={inst.name} key={inst.id} onSelect={() => form.setValue("institutionId", inst.id)}>
                                <Check className={cn("mr-2 h-4 w-4", inst.id === field.value ? "opacity-100" : "opacity-0")} />
                                {inst.name}
                            </CommandItem>
                            ))}
                        </ScrollArea>
                        </CommandGroup>
                    </Command>
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div>
            <FormLabel>Requisitos</FormLabel>
            <div className="space-y-2 mt-2">
                {reqFields.map((field, index) => (
                     <FormField
                        key={field.id}
                        control={form.control}
                        name={`requirements.${index}`}
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                               <FormControl><Input {...field} /></FormControl>
                               {reqFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeReq(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>}
                            </FormItem>
                        )}
                    />
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendReq('')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Requisito</Button>
            </div>
             <FormMessage>{form.formState.errors.requirements?.root?.message}</FormMessage>
        </div>

         <div>
            <FormLabel>Pasos</FormLabel>
            <div className="space-y-4 mt-2">
                {stepFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Paso {index + 1}</h4>
                            {stepFields.length > 1 && <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeStep(index)}><Trash2 className="w-4 h-4" /></Button>}
                        </div>
                        <FormField control={form.control} name={`steps.${index}.description`} render={({ field }) => (
                            <FormItem><FormLabel>Descripción del Paso</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`steps.${index}.location`} render={({ field }) => (
                            <FormItem><FormLabel>Lugar</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendStep({ step: stepFields.length + 1, description: '', location: '' })}><PlusCircle className="mr-2 h-4 w-4" />Añadir Paso</Button>
            </div>
             <FormMessage>{form.formState.errors.steps?.root?.message}</FormMessage>
        </div>

        <div>
            <FormLabel>Documentos</FormLabel>
            <div className="space-y-4 mt-2">
                {docFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                         <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Documento #{index + 1}</h4>
                            <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeDoc(index)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <FormField control={form.control} name={`documents.${index}.name`} render={({ field }) => (
                            <FormItem><FormLabel>Nombre del Documento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormItem>
                           <FormLabel>Archivo</FormLabel>
                           <div className="flex items-center gap-2">
                             <Input id={`doc-file-${index}`} type="file" onChange={(e) => handleFileChange(e, index)} className="flex-1" />
                             {form.getValues(`documents.${index}.url`) && <Check className="w-5 h-5 text-green-500" />}
                           </div>
                           <FormMessage>{form.formState.errors.documents?.[index]?.url?.message}</FormMessage>
                         </FormItem>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendDoc({ id: uuidv4(), name: '', url: '', createdAt: new Date().toISOString() })}><PlusCircle className="mr-2 h-4 w-4" />Añadir Documento</Button>
            </div>
            <FormMessage>{form.formState.errors.documents?.message}</FormMessage>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Trámite' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  )
}
