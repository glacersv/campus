import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProyectos } from '../../hooks/useProyectos';
import {
  Proyecto, Integrante, GRADOS_PROYECTO,
  Student, Subject
} from '../../types';
import { FileText, Users, AlertCircle, Search, ChevronDown, X, Check, Plus } from 'lucide-react';
import { getAvailableStudentsBySection, getStudent, getAllSubjects, getAllSections, getUserByStudentId } from '../../lib/firestore';

interface Props {
  proyectoInicial: Proyecto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface IntegranteForm {
  nombre: string;
  numero_lista: string;
  es_rep: boolean;
  uid: string;
}

export default function FormularioProyecto({ proyectoInicial, onCancel, onSuccess }: Props) {
  const { userProfile } = useAuth();
  const { crearProyecto, guardarBorrador, enviarAValidacion } = useProyectos();
  const esEdicion = !!proyectoInicial;

  // Compute initial grade and section before state
  const getInitialGrado = () => {
    if (proyectoInicial?.grado) return proyectoInicial.grado;
    if (userProfile?.gradeId) {
      const cleanId = userProfile.gradeId.replace('°', '');
      return GRADOS_PROYECTO.find(g => g.replace('°', '') === cleanId) || '';
    }
    return '';
  };

  const initialGrado = getInitialGrado();

  const getInitialSeccion = () => {
    if (proyectoInicial?.seccion) return proyectoInicial.seccion;
    if (userProfile?.sectionId) {
      return userProfile.sectionId.slice(-1).toUpperCase();
    }
    return '';
  };

  const [titulo, setTitulo] = useState(proyectoInicial?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion ?? '');
  const [grado, setGrado] = useState(initialGrado);
  const [seccion, setSeccion] = useState(getInitialSeccion());
  const [materiaId, setMateriaId] = useState(proyectoInicial?.materia_id ?? '');
  const [materiasSecundarias, setMateriasSecundarias] = useState<string[]>(proyectoInicial?.materias_secundarias ?? []);

  const [integrantes, setIntegrantes] = useState<IntegranteForm[]>(
    proyectoInicial?.integrantes_detalle?.map(i => ({
      nombre: i.nombre, numero_lista: String(i.numero_lista), es_rep: i.es_rep, uid: i.uid
    })) ??
    [{ nombre: '', numero_lista: '', es_rep: true, uid: '' }]
  );

  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSelector, setActiveSelector] = useState<number | null>(null);
  const [secciones, setSecciones] = useState<string[]>([]);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [materias, setMaterias] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const allSubjects = await getAllSubjects();
        
        // If docente, filter by their registered subjects
        if (userProfile?.role === 'docente' && userProfile.teacherId) {
          const { getTeacher } = await import('../../lib/firestore');
          const teacher = await getTeacher(userProfile.teacherId);
          if (teacher?.subjects && teacher.subjects.length > 0) {
            setTeacherSubjects(teacher.subjects);
            setMaterias(allSubjects.filter(s => teacher.subjects.includes(s.id)));
          } else {
            // Teacher has no subjects assigned, show all
            setMaterias(allSubjects);
          }
        } else {
          // For alumnos and others, show all subjects
          setMaterias(allSubjects);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      }
    };
    loadSubjects();
  }, [userProfile]);

  // Load sections from Firestore when grade changes
  useEffect(() => {
    if (!grado) { setSecciones([]); return; }
    const cleanGrade = grado.replace('°', '');
    getAllSections()
      .then(sections => {
        const matching = sections.filter(s => {
          const gradeNum = s.gradeId?.replace(/[^0-9]/g, '');
          return gradeNum === cleanGrade;
        });
        const letters = matching.map(s => s.name?.slice(-1)?.toUpperCase()).filter(Boolean);
        const unique = [...new Set(letters)].sort();
        setSecciones(unique);
      })
      .catch(() => setSecciones([]));
  }, [grado]);

  // Auto-load grade and section for students on mount
  useEffect(() => {
    const loadStudentData = async () => {
      if (userProfile?.role === 'alumno' && !proyectoInicial) {
        // If user profile has gradeId/sectionId, use them directly
        if (userProfile.gradeId && userProfile.sectionId) {
          const newGrado = getInitialGrado();
          const newSeccion = getInitialSeccion();
          if (newGrado) setGrado(newGrado);
          if (newSeccion) setSeccion(newSeccion);
        } 
        // Otherwise, fetch student data by studentId
        else if (userProfile.studentId) {
          setLoadingProfile(true);
          try {
            const student = await getStudent(userProfile.studentId);
            if (student) {
              // Handle different gradeId formats (e.g., "11", "11°", "11t", "11ta")
              const cleanGradeId = student.gradeId.replace(/[^0-9]/g, '');
              const gradeMatch = GRADOS_PROYECTO.find(g => g.replace(/[^0-9]/g, '') === cleanGradeId);
              if (gradeMatch) setGrado(gradeMatch);
              
              // Extract section letter from sectionId (e.g., "11ta" → "A")
              if (student.sectionId) {
                const sectionLetter = student.sectionId.slice(-1).toUpperCase();
                setSeccion(sectionLetter);
              }
            }
          } catch (err) {
            console.error('Error loading student data:', err);
          } finally {
            setLoadingProfile(false);
          }
        }
      }
    };
    
    loadStudentData();
  }, [userProfile]);

  useEffect(() => {
    // Skip reset for students since their section is auto-populated
    if (userProfile?.role === 'alumno') return;
    if (grado && !secciones.includes(seccion)) setSeccion('');
  }, [grado]);

  useEffect(() => {
    if (grado && seccion) {
      loadAvailableStudents();
    } else {
      setAvailableStudents([]);
    }
  }, [grado, seccion, proyectoInicial?.id]);

  const loadAvailableStudents = async () => {
    setLoadingStudents(true);
    try {
      const students = await getAvailableStudentsBySection(
        grado,
        seccion,
        proyectoInicial?.id
      );
      setAvailableStudents(students);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = availableStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.carnet?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function updateIntegrante(idx: number, field: keyof IntegranteForm, value: string | boolean) {
    setIntegrantes(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  async function selectStudent(idx: number, student: Student) {
    const user = await getUserByStudentId(student.id);
    const authUid = user?.uid || student.id;
    setIntegrantes(prev => prev.map((it, i) => i === idx ? {
      ...it,
      nombre: student.name,
      uid: authUid,
      numero_lista: it.numero_lista || '1'
    } : it));
    setActiveSelector(null);
    setSearchTerm('');
  }

  function removeStudent(idx: number) {
    setIntegrantes(prev => prev.map((it, i) => i === idx ? {
      ...it,
      nombre: '',
      uid: '',
      numero_lista: ''
    } : it));
  }

  function removeIntegrante(idx: number) {
    setIntegrantes(prev => prev.filter((_, i) => i !== idx));
  }

  function agregarIntegrante() {
    if (integrantes.length >= 6) return;
    setIntegrantes(prev => [...prev, { nombre: '', numero_lista: '', es_rep: false, uid: '' }]);
  }

  function validar(): boolean {
    const errs: Record<string, string> = {};

    if (loadingProfile) errs.global = 'Espera a que se carguen tus datos de perfil.';
    if (!grado) errs.grado = userProfile?.role === 'alumno' ? 'No se pudo detectar tu grado.' : 'Selecciona el grado.';
    if (!seccion) errs.seccion = userProfile?.role === 'alumno' ? 'No se pudo detectar tu sección.' : 'Selecciona la sección.';
    if (!materiaId) errs.materia = 'Selecciona la materia base.';
    if (titulo.length < 5 || titulo.length > 100) errs.titulo = 'El título debe tener entre 5 y 100 caracteres.';
    if (!descripcion.trim() || descripcion.length > 300) errs.descripcion = 'Descripción requerida (máx 300 caracteres).';

    const lider = integrantes[0];
    if (!lider?.nombre.trim()) errs.integrantes = 'Selecciona el líder del proyecto.';

    setErrores(errs);
    return Object.keys(errs).length === 0;
  }

  function buildIntegrantesDetalle(): Integrante[] {
    return integrantes.map((i, idx) => ({
      uid: i.es_rep && userProfile ? userProfile.uid : (i.uid || `temp-${idx}-${Date.now()}`),
      nombre: i.nombre.trim(),
      numero_lista: Number(i.numero_lista),
      es_rep: i.es_rep,
    }));
  }

  async function handleBorrador() {
    if (!validar()) return;
    setLoading(true);
    try {
      const materia = materias.find(m => m.id === materiaId);
      const integrantesData = buildIntegrantesDetalle();
      const materiaNombre = materia?.name || proyectoInicial?.materia_nombre || '';
      const baseData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        grado,
        seccion,
        materia_id: materiaId,
        materia_nombre: materiaNombre,
        materias_secundarias: materiasSecundarias,
      };
      if (esEdicion && proyectoInicial) {
        await guardarBorrador(proyectoInicial.id, {
          ...baseData,
          integrantes: integrantesData.map(i => i.uid),
          integrantes_detalle: integrantesData,
        });
      } else {
        await crearProyecto({
          ...baseData,
          integrantes: integrantesData,
        });
      }
      onSuccess();
    } catch (err) {
      setFeedback({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviar() {
    if (!validar()) return;
    setLoading(true);
    try {
      const materia = materias.find(m => m.id === materiaId);
      const materiaNombre = materia?.name || proyectoInicial?.materia_nombre || '';
      const data = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        grado,
        seccion,
        materia_id: materiaId,
        materia_nombre: materiaNombre,
        materias_secundarias: materiasSecundarias,
        integrantes: buildIntegrantesDetalle(),
      };
      if (esEdicion && proyectoInicial) {
        await enviarAValidacion(proyectoInicial.id);
      } else {
        const result = await crearProyecto(data);
        if (result.id) await enviarAValidacion(result.id);
      }
      onSuccess();
    } catch (err) {
      setFeedback({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al enviar' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {feedback.texto}
        </div>
      )}

      {errores.global && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errores.global}
        </div>
      )}

      {loadingProfile && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Cargando datos de tu perfil...
        </div>
      )}

      <div className="p-5">
        <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
          <FormField label="Grado *" error={errores.grado}>
            {loadingProfile ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-400 text-xs">Cargando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                {GRADOS_PROYECTO.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { if (userProfile?.role !== 'alumno') setGrado(g); }}
                    disabled={userProfile?.role === 'alumno'}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      grado === g
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    } ${userProfile?.role === 'alumno' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
            {userProfile?.role === 'alumno' && !loadingProfile && grado && (
              <span className="text-[10px] text-emerald-600 mt-1 block">✓ Auto-detectado de tu perfil</span>
            )}
          </FormField>

          <FormField label="Sección *" error={errores.seccion}>
            {loadingProfile ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-400 text-xs">Cargando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                {secciones.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { if (grado) setSeccion(s); }}
                    disabled={!grado}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      seccion === s
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    } ${!grado ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </FormField>
        </div>

        <FormField label="Materia base *" error={errores.materia}>
          {esEdicion ? (
            <div className="form-input font-semibold bg-primary/5 border-primary/30 text-primary cursor-not-allowed">
              {materias.find(m => m.id === materiaId)?.name || proyectoInicial?.materia_nombre || 'Sin materia'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {materias.map(m => {
                const isSelected = materiaId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMateriaId(isSelected ? '' : m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {m.name}
                  </button>
                );
              })}
              {materias.length === 0 && (
                <span className="text-xs text-slate-400 italic">No hay materias disponibles</span>
              )}
            </div>
          )}
          {esEdicion && (
            <span className="text-[10px] text-slate-400 mt-1 block">La materia base no se puede cambiar después de crear el proyecto</span>
          )}
        </FormField>

        {/* Materias secundarias */}
        <div className="mt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Materias adicionales
          </span>
          <div className="flex flex-wrap gap-1.5">
            {materias
              .filter(m => m.id !== materiaId)
              .map(m => {
                const isSelected = materiasSecundarias.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setMateriasSecundarias(prev => prev.filter(id => id !== m.id));
                      } else {
                        setMateriasSecundarias(prev => [...prev, m.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {m.name}
                  </button>
                );
              })}
          </div>
        </div>

        <FormField label={`Título del proyecto * (${titulo.length}/100)`} error={errores.titulo}>
          <input className="form-input" type="text" value={titulo} maxLength={100}
            onChange={e => setTitulo(e.target.value)} placeholder="Mínimo 5 caracteres, máximo 100" />
        </FormField>

        <FormField label={`Descripción breve * (${descripcion.length}/300)`} error={errores.descripcion}>
          <textarea className="form-input min-h-[80px] resize-y" value={descripcion} maxLength={300}
            onChange={e => setDescripcion(e.target.value)} placeholder="Explica brevemente el proyecto..." />
        </FormField>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" /> Líder del proyecto
        </h3>

        {errores.integrantes && <ErrMsg msg={errores.integrantes} />}

        {!grado || !seccion ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Selecciona grado y sección para ver los estudiantes disponibles
          </div>
        ) : loadingStudents ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Cargando estudiantes...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_80px] gap-2 mb-2 text-[10px] text-slate-400 font-medium">
              <span>Nombre completo</span><span className="text-center">N° lista</span>
            </div>

            {integrantes.map((int, idx) => (
              <div key={idx} className="mb-2">
                <div className="grid grid-cols-[1fr_80px] gap-2 items-center">
                  <div className="relative">
                    {int.uid ? (
                      <div className="form-input text-sm flex items-center justify-between bg-slate-50">
                        <span className="truncate">{int.nombre}</span>
                        <button
                          type="button"
                          onClick={() => removeStudent(idx)}
                          className="text-slate-400 hover:text-red-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveSelector(activeSelector === idx ? null : idx)}
                          className="form-input text-sm text-left text-slate-400 flex items-center justify-between w-full"
                        >
                          <span>{idx === 0 ? 'Seleccionar líder' : `Integrante ${idx + 1}`}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => removeIntegrante(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                            title="Eliminar slot"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <input className="form-input text-sm text-center" type="number" min={1} max={40} placeholder="00"
                    value={int.numero_lista || ''} onChange={e => updateIntegrante(idx, 'numero_lista', e.target.value)} />
                </div>

                {activeSelector === idx && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o carnet..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No hay estudiantes disponibles
                        </div>
                      ) : (
                        filteredStudents.map(student => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => selectStudent(idx, student)}
                            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold text-slate-700">{student.name}</p>
                              <p className="text-[10px] text-slate-400">Carnet: {student.carnet || 'N/A'}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {integrantes.length < 6 && (
              <button
                type="button"
                onClick={agregarIntegrante}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary font-bold hover:text-primary-dark transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar integrante
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button className="btn-secondary flex-1" onClick={handleBorrador} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {(!esEdicion || !proyectoInicial || ['borrador', 'rechazado_materia'].includes(proyectoInicial.estado)) && (
          <button className="btn-primary flex-1"
            onClick={handleEnviar} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar a validación'}
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className={`form-label ${error ? '!text-red-500' : ''}`}>{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2 mb-3 border-l-2 border-red-300">
      {msg}
    </div>
  );
}
