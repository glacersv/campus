// Editor de Contenido de Módulo — Docente
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../contexts/AuthContext';
import { lmsService } from '../../../services/lmsService';
import { LMSModuleContent, LMSContentItem, LMSExample, LMSExercise, LMSCourse } from '../../../types';
import { BTV_GRAPHIC_DESIGN_COURSES, getModuleDescriptorData } from '../../../services/btvCurriculumData';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Video,
  FileText,
  Image,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type Tab = 'teoria' | 'ejemplos' | 'ejercicios';

export default function ModuleContentEditor() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('teoria');
  const [content, setContent] = useState<LMSModuleContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [module, setModule] = useState<{ name: string; code: string; descriptor: any } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryBody, setTheoryBody] = useState('');
  const [theoryVideo, setTheoryVideo] = useState('');
  const [expandedTheory, setExpandedTheory] = useState<string | null>(null);

  const [exampleTitle, setExampleTitle] = useState('');
  const [exampleDesc, setExampleDesc] = useState('');
  const [exampleImage, setExampleImage] = useState('');
  const [exampleSolution, setExampleSolution] = useState('');

  const [exerciseTitle, setExerciseTitle] = useState('');
  const [exerciseInstructions, setExerciseInstructions] = useState('');
  const [exerciseDifficulty, setExerciseDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [exerciseSolution, setExerciseSolution] = useState('');

  useEffect(() => {
    if (!moduleId) return;
    loadData();
  }, [moduleId]);

  const loadData = async () => {
    if (!moduleId) return;
    try {
      const [mod, modContent] = await Promise.all([
        lmsService.getModuleById(moduleId),
        lmsService.getModuleContent(moduleId),
      ]);

      if (mod) {
        setModule({ 
          name: mod.name, 
          code: mod.code,
          descriptor: mod.descriptor 
        });
      } else {
        // Fallback: buscar en seed data de BTV
        const courseId = moduleId.replace('lms-mod-', '');
        const btvCourse = BTV_GRAPHIC_DESIGN_COURSES.find(c => c.id === courseId);
        if (btvCourse) {
          const descriptor = getModuleDescriptorData(btvCourse.code);
          setModule({ 
            name: btvCourse.name, 
            code: btvCourse.code,
            descriptor: descriptor 
          });
        } else {
          setModule(null);
        }
      }

      if (modContent) {
        setContent(modContent);
      } else {
        // Si no hay contenido guardado, inicializar vacío pero con datos del módulo
        setContent({
          moduleId,
          theory: [],
          examples: [],
          exercises: [],
          updatedBy: userProfile?.uid || '',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error loading module content:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!moduleId || !content) return;
    setSaving(true);
    try {
      await lmsService.saveModuleContent(moduleId, content, userProfile?.uid || '');
      alert('Contenido guardado exitosamente');
    } catch (e) {
      console.error('Error saving content:', e);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Theory handlers
  const addTheoryItem = () => {
    if (!theoryTitle.trim()) return;
    const newItem: LMSContentItem = {
      id: `th-${Date.now()}`,
      title: theoryTitle,
      body: theoryBody,
      videoUrl: theoryVideo || undefined,
      attachments: [],
      order: (content?.theory.length || 0) + 1,
    };
    setContent(prev => prev ? { ...prev, theory: [...prev.theory, newItem] } : prev);
    setTheoryTitle('');
    setTheoryBody('');
    setTheoryVideo('');
  };

  const removeTheoryItem = (id: string) => {
    setContent(prev => prev ? { ...prev, theory: prev.theory.filter(t => t.id !== id) } : prev);
  };

  // Example handlers
  const addExample = () => {
    if (!exampleTitle.trim()) return;
    const newExample: LMSExample = {
      id: `ex-${Date.now()}`,
      title: exampleTitle,
      description: exampleDesc,
      imageUrl: exampleImage || undefined,
      solutionUrl: exampleSolution || undefined,
      order: (content?.examples.length || 0) + 1,
    };
    setContent(prev => prev ? { ...prev, examples: [...prev.examples, newExample] } : prev);
    setExampleTitle('');
    setExampleDesc('');
    setExampleImage('');
    setExampleSolution('');
  };

  const removeExample = (id: string) => {
    setContent(prev => prev ? { ...prev, examples: prev.examples.filter(e => e.id !== id) } : prev);
  };

  // Exercise handlers
  const addExercise = () => {
    if (!exerciseTitle.trim()) return;
    const newExercise: LMSExercise = {
      id: `exer-${Date.now()}`,
      title: exerciseTitle,
      instructions: exerciseInstructions,
      difficulty: exerciseDifficulty,
      solution: exerciseSolution || undefined,
      order: (content?.exercises.length || 0) + 1,
    };
    setContent(prev => prev ? { ...prev, exercises: [...prev.exercises, newExercise] } : prev);
    setExerciseTitle('');
    setExerciseInstructions('');
    setExerciseDifficulty('medium');
    setExerciseSolution('');
  };

  const removeExercise = (id: string) => {
    setContent(prev => prev ? { ...prev, exercises: prev.exercises.filter(e => e.id !== id) } : prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!moduleId || !content || !module) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/docente/lms')}
            className="text-xs text-slate-500 hover:text-primary mb-2"
          >
            ← Volver a Mis Módulos
          </button>
          <h1 className="text-2xl font-display font-extrabold text-slate-900">
            {module.name || 'Módulo'}
          </h1>
          <p className="text-sm text-slate-500">{module.code}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Todo'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-fit">
        {[
          { key: 'teoria', label: 'Teoría', icon: FileText },
          { key: 'ejemplos', label: 'Ejemplos', icon: Image },
          { key: 'ejercicios', label: 'Ejercicios', icon: HelpCircle },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Theory Tab */}
      {activeTab === 'teoria' && (
        <div className="space-y-4">
          <div className="card-crema p-5 border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Agregar Contenido Teórico</h3>
            <input
              type="text"
              placeholder="Título (ej: Herramientas básicas de Illustrator)"
              value={theoryTitle}
              onChange={e => setTheoryTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              placeholder="Explicación teórica..."
              value={theoryBody}
              onChange={e => setTheoryBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
            <input
              type="url"
              placeholder="URL de video (YouTube, Vimeo, etc.)"
              value={theoryVideo}
              onChange={e => setTheoryVideo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={addTheoryItem}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>

          <div className="space-y-2">
            {content.theory.map((item, idx) => (
              <div key={item.id} className="card-crema p-4 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="w-4 h-4 text-slate-300" />
                      <h4 className="font-bold text-sm text-slate-900">{idx + 1}. {item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 ml-6">{item.body}</p>
                    {item.videoUrl && (
                      <div className="flex items-center gap-1 ml-6 mt-1 text-xs text-blue-600">
                        <Video className="w-3 h-3" />
                        <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Ver video
                        </a>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeTheoryItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'ejemplos' && (
        <div className="space-y-4">
          <div className="card-crema p-5 border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Agregar Ejemplo</h3>
            <input
              type="text"
              placeholder="Título del ejemplo"
              value={exampleTitle}
              onChange={e => setExampleTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              placeholder="Descripción del ejemplo..."
              value={exampleDesc}
              onChange={e => setExampleDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
            <input
              type="url"
              placeholder="URL de imagen (opcional)"
              value={exampleImage}
              onChange={e => setExampleImage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="url"
              placeholder="URL de solución (opcional)"
              value={exampleSolution}
              onChange={e => setExampleSolution(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={addExample}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>

          <div className="space-y-2">
            {content.examples.map((ex, idx) => (
              <div key={ex.id} className="card-crema p-4 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="w-4 h-4 text-slate-300" />
                      <h4 className="font-bold text-sm text-slate-900">{idx + 1}. {ex.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 ml-6">{ex.description}</p>
                    {ex.imageUrl && (
                      <div className="flex items-center gap-1 ml-6 mt-1 text-xs text-blue-600">
                        <Image className="w-3 h-3" />
                        <a href={ex.imageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Ver imagen
                        </a>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeExample(ex.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'ejercicios' && (
        <div className="space-y-4">
          <div className="card-crema p-5 border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Agregar Ejercicio</h3>
            <input
              type="text"
              placeholder="Título del ejercicio"
              value={exerciseTitle}
              onChange={e => setExerciseTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              placeholder="Instrucciones..."
              value={exerciseInstructions}
              onChange={e => setExerciseInstructions(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
            <select
              value={exerciseDifficulty}
              onChange={e => setExerciseDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Medio</option>
              <option value="hard">Difícil</option>
            </select>
            <input
              type="text"
              placeholder="Solución (opcional)"
              value={exerciseSolution}
              onChange={e => setExerciseSolution(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={addExercise}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>

          <div className="space-y-2">
            {content.exercises.map((exer, idx) => (
              <div key={exer.id} className="card-crema p-4 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="w-4 h-4 text-slate-300" />
                      <h4 className="font-bold text-sm text-slate-900">{idx + 1}. {exer.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exer.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' :
                        exer.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {exer.difficulty === 'easy' ? 'Fácil' : exer.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 ml-6">{exer.instructions}</p>
                    {exer.solution && (
                      <p className="text-xs text-slate-500 ml-6 mt-1 italic">Solución: {exer.solution}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeExercise(exer.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
