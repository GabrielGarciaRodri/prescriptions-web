import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Search, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, extractErrorMessage } from '@/lib/api';
import type { PatientSearchResult, Prescription } from '@/lib/types';

const itemSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
  dosage: z.string().max(80).optional().or(z.literal('')),
  quantity: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === '' || v === undefined || v === null) return undefined;
      const n = typeof v === 'string' ? parseInt(v, 10) : v;
      return isNaN(n) ? undefined : n;
    })
    .refine((v) => v === undefined || v > 0, 'Debe ser un entero positivo'),
  instructions: z.string().max(255).optional().or(z.literal('')),
});

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(itemSchema).min(1, 'Debe haber al menos un medicamento'),
});

type FormValues = z.input<typeof schema>;

export default function NewPrescriptionPage() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: '',
      notes: '',
      items: [{ name: '', dosage: '', quantity: '', instructions: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Búsqueda de pacientes con debounce
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedPatient || search.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get<PatientSearchResult[]>('/patients/search', {
          params: { email: search.trim() },
        });
        setResults(res.data);
        setShowResults(true);
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Error al buscar pacientes'));
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, selectedPatient]);

  function pickPatient(p: PatientSearchResult) {
    setSelectedPatient(p);
    setValue('patientId', p.id, { shouldValidate: true });
    setShowResults(false);
    setSearch(p.email);
  }

  function clearPatient() {
    setSelectedPatient(null);
    setValue('patientId', '', { shouldValidate: true });
    setSearch('');
    setResults([]);
  }

  async function onSubmit(values: FormValues) {
    // Normalizar: quitar strings vacíos opcionales
    const payload = {
      patientId: values.patientId,
      notes: values.notes || undefined,
      items: values.items.map((it) => ({
        name: it.name,
        dosage: it.dosage || undefined,
        quantity:
          it.quantity === '' || it.quantity === undefined
            ? undefined
            : typeof it.quantity === 'string'
            ? parseInt(it.quantity, 10)
            : it.quantity,
        instructions: it.instructions || undefined,
      })),
    };

    try {
      const { data } = await api.post<Prescription>('/prescriptions', payload);
      toast.success(`Prescripción ${data.code} creada`);
      router.push(`/doctor/prescriptions/${data.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'No se pudo crear la prescripción'));
    }
  }

  return (
    <RouteGuard allowedRoles={['doctor']}>
      <AppLayout>
        <div className="mb-6">
          <Link
            href="/doctor/prescriptions"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nueva prescripción</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 max-w-4xl"
          noValidate
        >
          {/* PACIENTE */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Paciente</h2>

            {selectedPatient ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                    <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={clearPatient}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por email (mín. 2 caracteres)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {searching && (
                  <p className="text-xs text-gray-500 mt-1">Buscando...</p>
                )}
                {showResults && results.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => pickPatient(p)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {showResults && !searching && search.trim().length >= 2 && results.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Sin resultados.</p>
                )}
                {errors.patientId && (
                  <p className="text-xs text-red-600 mt-1">{errors.patientId.message}</p>
                )}
              </div>
            )}
          </div>

          {/* NOTAS */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Notas (opcional)</h2>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Indicaciones generales para el paciente"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.notes && (
              <p className="text-xs text-red-600 mt-1">{errors.notes.message as string}</p>
            )}
          </div>

          {/* ITEMS */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Medicamentos</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ name: '', dosage: '', quantity: '', instructions: '' })}
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>

            {errors.items && typeof errors.items.message === 'string' && (
              <p className="text-xs text-red-600 mb-2">{errors.items.message}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-gray-200 rounded-md p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Medicamento {idx + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Eliminar medicamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Nombre *"
                      placeholder="Ej. Amoxicilina 500mg"
                      {...register(`items.${idx}.name`)}
                      error={errors.items?.[idx]?.name?.message as string | undefined}
                    />
                    <Input
                      label="Dosis"
                      placeholder="Ej. 1 cada 8 horas"
                      {...register(`items.${idx}.dosage`)}
                      error={errors.items?.[idx]?.dosage?.message as string | undefined}
                    />
                    <Input
                      label="Cantidad"
                      type="number"
                      min={1}
                      placeholder="Ej. 21"
                      {...register(`items.${idx}.quantity`)}
                      error={errors.items?.[idx]?.quantity?.message as string | undefined}
                    />
                    <Input
                      label="Instrucciones"
                      placeholder="Ej. Después de comer"
                      {...register(`items.${idx}.instructions`)}
                      error={errors.items?.[idx]?.instructions?.message as string | undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACCIONES */}
          <div className="flex justify-end gap-3">
            <Link href="/doctor/prescriptions">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={isSubmitting}>
              Crear prescripción
            </Button>
          </div>
        </form>
      </AppLayout>
    </RouteGuard>
  );
}