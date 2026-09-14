import React, { useState, useEffect } from 'react';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  MessageCircle,
  Shield,
} from 'lucide-react';
import {
  PRIORITY_OPTIONS,
  LOCATION_OPTIONS,
  AGE_RANGE_OPTIONS,
  PriorityKey,
  LocationKey,
  AgeRangeKey,
  SubmissionInput,
} from '../types';
import { responsesService } from '../services/responsesService';
import { Logo } from './Logo';
import { PanoramicBanner } from './PanoramicBanner';
import { CitySkyline } from './CitySkyline';
import { PriorityIcon } from './PriorityIcon';

interface SurveyWizardProps {
  onStepChange?: (step: number) => void;
  onNavigateAdmin?: () => void;
}

export const SurveyWizard: React.FC<SurveyWizardProps> = ({ onStepChange, onNavigateAdmin }) => {
  // Wizard steps: 0 = Landing, 1 = P1, 2 = P2, 3 = P3, 4 = P4, 5 = P5, 6 = P6, 7 = Success
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // Form responses
  const [moraNoMunicipio, setMoraNoMunicipio] = useState<boolean | null>(null);
  const [localidade, setLocalidade] = useState<LocationKey | ''>('');
  const [localidadeInformada, setLocalidadeInformada] = useState<string>('');

  const [prioridade1, setPrioridade1] = useState<PriorityKey | ''>('');
  const [prioridade1Outra, setPrioridade1Outra] = useState<string>('');

  const [prioridade2, setPrioridade2] = useState<PriorityKey | ''>('');
  const [prioridade2Outra, setPrioridade2Outra] = useState<string>('');

  const [comentario, setComentario] = useState<string>('');
  const [faixaEtaria, setFaixaEtaria] = useState<AgeRangeKey | ''>('');

  // Honeypot anti-bot
  const [honeypot, setHoneypot] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStart = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step === 1) {
      setStep(0);
    } else if (step === 3 && moraNoMunicipio === false) {
      // Skipped P2 because doesn't live in Vitoria do Xingu
      setStep(1);
    } else {
      setStep((prev) => Math.max(0, prev - 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1: P1 Moradia
  const handleSelectMoradia = (mora: boolean) => {
    setMoraNoMunicipio(mora);
    setErrorMessage(null);
  };

  const handleNextFromStep1 = () => {
    if (moraNoMunicipio === null) {
      setErrorMessage('Por favor, informe se você mora em Vitória do Xingu.');
      return;
    }
    setErrorMessage(null);
    if (moraNoMunicipio) {
      setStep(2);
    } else {
      setLocalidade('Não mora no município');
      setLocalidadeInformada('');
      setStep(3); // Skip localidade
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: P2 Localidade
  const handleSelectLocalidade = (loc: LocationKey) => {
    setLocalidade(loc);
    setErrorMessage(null);
    if (loc !== 'Zona rural / comunidade' && loc !== 'Outro local do município') {
      setLocalidadeInformada('');
    }
  };

  const handleNextFromStep2 = () => {
    if (!localidade) {
      setErrorMessage('Por favor, selecione onde você mora.');
      return;
    }
    if (
      (localidade === 'Zona rural / comunidade' || localidade === 'Outro local do município') &&
      !localidadeInformada.trim()
    ) {
      setErrorMessage('Por favor, especifique sua comunidade, vicinal ou localidade.');
      return;
    }
    setErrorMessage(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: P3 Prioridade 1
  const handleSelectPrioridade1 = (pri: PriorityKey) => {
    setPrioridade1(pri);
    setErrorMessage(null);
    if (pri !== 'Outra') {
      setPrioridade1Outra('');
    }
    if (prioridade2 === pri) {
      setPrioridade2('');
      setPrioridade2Outra('');
    }
  };

  const handleNextFromStep3 = () => {
    if (!prioridade1) {
      setErrorMessage('Por favor, selecione a sua Prioridade Nº 1.');
      return;
    }
    if (prioridade1 === 'Outra' && !prioridade1Outra.trim()) {
      setErrorMessage('Por favor, descreva qual é a sua Prioridade Nº 1.');
      return;
    }
    setErrorMessage(null);
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4: P4 Segunda Prioridade
  const handleSelectPrioridade2 = (pri: PriorityKey) => {
    if (pri === prioridade1) {
      setErrorMessage('A segunda prioridade não pode ser igual à Prioridade Nº 1.');
      return;
    }
    setPrioridade2(pri);
    setErrorMessage(null);
    if (pri !== 'Outra') {
      setPrioridade2Outra('');
    }
  };

  const handleNextFromStep4 = () => {
    if (!prioridade2) {
      setErrorMessage('Por favor, selecione a sua Segunda Prioridade.');
      return;
    }
    if (prioridade2 === prioridade1) {
      setErrorMessage('A segunda prioridade não pode ser igual à Prioridade Nº 1.');
      return;
    }
    if (prioridade2 === 'Outra' && !prioridade2Outra.trim()) {
      setErrorMessage('Por favor, descreva qual é a sua Segunda Prioridade.');
      return;
    }
    setErrorMessage(null);
    setStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 5: P5 Comentário
  const handleNextFromStep5 = () => {
    setErrorMessage(null);
    setStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 6: Final Submission
  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const payload: SubmissionInput = {
      moraNoMunicipio: moraNoMunicipio === true,
      localidade: moraNoMunicipio ? (localidade as string) : 'Não mora no município',
      localidadeInformada: localidadeInformada.trim() || undefined,
      prioridade1: prioridade1 as string,
      prioridade1Outra: prioridade1Outra.trim() || undefined,
      prioridade2: prioridade2 as string,
      prioridade2Outra: prioridade2Outra.trim() || undefined,
      comentario: comentario.trim() || undefined,
      faixaEtaria: faixaEtaria ? (faixaEtaria as string) : undefined,
      website_hp: honeypot,
    };

    try {
      await responsesService.submitResponse(payload);

      setStep(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao enviar sua resposta. Por favor tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp share link
  const handleShareWhatsApp = () => {
    const currentUrl = window.location.origin;
    const text = encodeURIComponent(
      `Participe também do projeto 100 Vozes da Cidade em Vitória do Xingu! Dê sua opinião sobre as prioridades para o futuro do nosso município:\n\n${currentUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleResetSurvey = () => {
    setMoraNoMunicipio(null);
    setLocalidade('');
    setLocalidadeInformada('');
    setPrioridade1('');
    setPrioridade1Outra('');
    setPrioridade2('');
    setPrioridade2Outra('');
    setComentario('');
    setFaixaEtaria('');
    setErrorMessage(null);
    setStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSingleScreen = step === 0 || step === 7;

  return (
    <div
      className={`w-full ${
        isSingleScreen
          ? 'h-[100dvh] max-h-[100dvh] overflow-y-auto flex flex-col justify-between py-1.5 xs:py-2 sm:py-3 px-3 sm:px-4'
          : 'min-h-[100dvh] flex flex-col justify-between py-2 sm:py-3.5 px-3 sm:px-4'
      }`}
    >
      {/* Honeypot field (hidden from human view) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_hp_input">Website</label>
        <input
          id="website_hp_input"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div
        className={`w-full max-w-[430px] mx-auto flex-1 flex flex-col ${
          isSingleScreen ? 'h-full justify-between' : ''
        }`}
      >
        {/* =========================================================
            TELA 0: LANDING PAGE (EXATAMENTE CONFORME REFERÊNCIA)
        ========================================================= */}
        {step === 0 && (
          <div className="flex-1 h-full max-h-[100dvh] flex flex-col justify-between items-center text-center py-0.5 animate-in fade-in duration-300">
            {/* Cabeçalho compacto (somente botão administrativo; logo será sobreposto no hero) */}
            <div className="w-full relative flex items-center justify-center pt-0.5 pb-0.5 shrink-0">
              {onNavigateAdmin && (
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="absolute right-1 top-0.5 p-1 text-slate-300 hover:text-slate-600 transition-colors rounded-lg"
                  title="Acesso da Equipe"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Imagem Principal de Vitória do Xingu */}
            <div className="w-full px-0.5 my-1 sm:my-1.5 shrink-0">
              <PanoramicBanner className="relative left-1/2 w-screen -translate-x-1/2 sm:left-auto sm:w-full sm:translate-x-0 h-[360px] sm:h-[380px] rounded-none sm:rounded-2xl overflow-hidden" />
            </div>

            {/* Headline e Texto */}
            <div className="space-y-1 sm:space-y-1.5 px-1 shrink-0">
              <h1 className="text-[16px] xs:text-[17px] sm:text-xl font-black text-[#111e32] tracking-tight leading-snug">
                O futuro da nossa cidade também <br/>passa pela sua voz.
              </h1>
              <p className="text-[11px] xs:text-[11.5px] sm:text-xs text-slate-600 leading-snug max-w-[340px] mx-auto">
                Queremos ouvir moradores de Vitória do Xingu sobre quais áreas devem receber novos investimentos, oportunidades e atenção nos próximos anos.
              </p>
            </div>

            {/* Indicador de tempo */}
            <div className="shrink-0 my-0.5 sm:my-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                <Clock className="w-3.5 h-3.5 text-[#00a86b]" />
                <span>Leva menos de 1 minuto.</span>
              </div>
            </div>

            {/* CTA: Botão Grande Verde */}
            <div className="w-full px-1 shrink-0 my-0.5 sm:my-1">
              <button
                id="btn-quero-participar"
                type="button"
                onClick={handleStart}
                className="w-full bg-[#00a86b] hover:bg-[#00925d] active:scale-[0.99] text-white font-extrabold py-3 sm:py-3.5 px-6 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs xs:text-sm uppercase tracking-wider min-h-[44px]"
              >
                <span>QUERO PARTICIPAR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rodapé Visual */}
            <div className="w-full flex flex-col items-center space-y-1 pt-1 pb-0.5 shrink-0">
              <CitySkyline className="w-full max-w-[210px] xs:max-w-[230px] sm:max-w-[250px] skyline-adaptive h-auto" />
              <p className="text-[10px] xs:text-[10.5px] font-medium text-slate-500 italic">
                Mais ideias. Mais oportunidades. Uma cidade ainda melhor.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            ETAPAS DO WIZARD: 1 A 6
        ========================================================= */}
        {step >= 1 && step <= 6 && (
          <div className="flex-1 flex flex-col justify-between space-y-4 sm:space-y-5 animate-in fade-in duration-200">
            {/* Top Wizard Bar */}
            <div className="space-y-2 pt-0.5">
              {/* Logo Centralizado, maior e mais elegante */}
              <div className="flex justify-center pb-0.5">
                <Logo size="md" showSubtitle={true} />
              </div>

              {/* Progress Bar & Step Indicator */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00a86b] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((step / 6) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  {step} de 6
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Question Content */}
            <div className="flex-1 flex flex-col justify-start space-y-3.5 sm:space-y-4">
              {/* =========================================
                  ETAPA 1: Você mora em Vitória do Xingu?
              ========================================== */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-[#111e32] leading-snug">
                    Você mora em Vitória do Xingu?
                  </h2>

                  <div className="space-y-3 pt-2">
                    {/* Option: Sim */}
                    <button
                      type="button"
                      onClick={() => handleSelectMoradia(true)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                        moraNoMunicipio === true
                          ? 'border-[#00a86b] bg-[#eefcf5] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          moraNoMunicipio === true
                            ? 'bg-[#00a86b] text-white'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {moraNoMunicipio === true && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={`text-sm ${moraNoMunicipio === true ? 'font-bold text-[#111e32]' : 'text-slate-800'}`}>
                        Sim, moro em Vitória do Xingu
                      </span>
                    </button>

                    {/* Option: Não */}
                    <button
                      type="button"
                      onClick={() => handleSelectMoradia(false)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                        moraNoMunicipio === false
                          ? 'border-[#00a86b] bg-[#eefcf5] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          moraNoMunicipio === false
                            ? 'bg-[#00a86b] text-white'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {moraNoMunicipio === false && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={`text-sm ${moraNoMunicipio === false ? 'font-bold text-[#111e32]' : 'text-slate-800'}`}>
                        Não moro no município
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================
                  ETAPA 2: Onde você mora?
              ========================================== */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-[#111e32] leading-snug">
                    Onde você mora?
                  </h2>

                  <div className="space-y-2.5 pt-1">
                    {LOCATION_OPTIONS.map((loc) => {
                      const isSelected = localidade === loc;
                      return (
                        <div key={loc} className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleSelectLocalidade(loc)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                              isSelected
                                ? 'border-[#00a86b] bg-[#eefcf5] shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#00a86b] text-white'
                                  : 'border-2 border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-sm ${isSelected ? 'font-bold text-[#111e32]' : 'text-slate-800'}`}>
                              {loc}
                            </span>
                          </button>

                          {/* Complementary input for Rural or Outro */}
                          {isSelected && (loc === 'Zona rural / comunidade' || loc === 'Outro local do município') && (
                            <div className="pl-8 pr-1 animate-in fade-in duration-200">
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {loc === 'Zona rural / comunidade'
                                  ? 'Qual comunidade ou vicinal?'
                                  : 'Especifique o local:'}
                              </label>
                              <input
                                type="text"
                                value={localidadeInformada}
                                onChange={(e) => setLocalidadeInformada(e.target.value)}
                                placeholder="Ex: Comunidade Santa Rita, Vicinal 12, etc."
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] focus:border-[#00a86b]"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================
                  ETAPA 3: PRIORIDADE Nº 1
              ========================================== */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-[#111e32] leading-snug">
                    Pensando no futuro de Vitória do Xingu, qual deve ser a sua <span className="text-[#00a86b]">PRIORIDADE Nº 1</span> para novos investimentos e oportunidades?
                  </h2>

                  <div className="space-y-2 pt-1 max-h-[50vh] overflow-y-auto pr-1">
                    {PRIORITY_OPTIONS.map((pri) => {
                      const isSelected = prioridade1 === pri;
                      return (
                        <div key={pri} className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleSelectPrioridade1(pri)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'border-[#00a86b] bg-[#eefcf5] shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#00a86b] text-white'
                                  : 'border-2 border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              <PriorityIcon name={pri} className="w-4 h-4" />
                            </div>

                            <span className={`text-sm ${isSelected ? 'font-bold text-[#111e32]' : 'text-slate-800'}`}>
                              {pri}
                            </span>
                          </button>

                          {isSelected && pri === 'Outra' && (
                            <div className="pl-8 pr-1 animate-in fade-in duration-200">
                              <input
                                type="text"
                                value={prioridade1Outra}
                                onChange={(e) => setPrioridade1Outra(e.target.value)}
                                placeholder="Descreva qual é essa prioridade..."
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] focus:border-[#00a86b]"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================
                  ETAPA 4: SEGUNDA PRIORIDADE
              ========================================== */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-[#111e32] leading-snug">
                    E qual seria a sua <span className="text-[#0080ff]">SEGUNDA</span> prioridade?
                  </h2>

                  <div className="space-y-2 pt-1 max-h-[50vh] overflow-y-auto pr-1">
                    {PRIORITY_OPTIONS.map((pri) => {
                      const isP1 = prioridade1 === pri;
                      const isSelected = prioridade2 === pri;

                      return (
                        <div key={pri} className="space-y-2">
                          <button
                            type="button"
                            disabled={isP1}
                            onClick={() => handleSelectPrioridade2(pri)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                              isP1
                                ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                                : isSelected
                                ? 'border-[#00a86b] bg-[#eefcf5] shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#00a86b] text-white'
                                  : isP1
                                  ? 'border-2 border-slate-300 bg-slate-200'
                                  : 'border-2 border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              <PriorityIcon name={pri} className="w-4 h-4" />
                            </div>

                            <div className="flex-1 flex items-center justify-between">
                              <span className={`text-sm ${isSelected ? 'font-bold text-[#111e32]' : 'text-slate-800'}`}>
                                {pri}
                              </span>
                              {isP1 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  (Prioridade Nº 1)
                                </span>
                              )}
                            </div>
                          </button>

                          {isSelected && pri === 'Outra' && (
                            <div className="pl-8 pr-1 animate-in fade-in duration-200">
                              <input
                                type="text"
                                value={prioridade2Outra}
                                onChange={(e) => setPrioridade2Outra(e.target.value)}
                                placeholder="Descreva qual é essa segunda prioridade..."
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] focus:border-[#00a86b]"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================
                  ETAPA 5: COMENTÁRIO (OPCIONAL)
              ========================================== */}
              {step === 5 && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-[#111e32] leading-snug">
                    Pensando na área que você escolheu como principal prioridade{' '}
                    <span className="text-[#00a86b]">({prioridade1 || 'sua escolha'})</span>, o que você gostaria de ver avançar em Vitória do Xingu?
                  </h2>

                  <div className="pt-2 space-y-2">
                    <textarea
                      rows={5}
                      maxLength={300}
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Escreva aqui a sua ideia... (opcional)"
                      className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a86b] focus:border-[#00a86b] placeholder:text-slate-400 bg-white"
                    />
                    <div className="flex justify-end text-xs text-slate-400 font-mono">
                      {comentario.length}/300 caracteres
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================
                  ETAPA 6: FAIXA ETÁRIA (OPCIONAL)
              ========================================== */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#111e32] leading-snug">
                      Qual é a sua faixa etária?
                    </h2>
                    <span className="text-xs text-slate-400">(opcional)</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {AGE_RANGE_OPTIONS.map((range) => {
                      const isSelected = faixaEtaria === range;
                      return (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setFaixaEtaria(range)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                            isSelected
                              ? 'border-[#00a86b] bg-[#eefcf5] shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#00a86b] text-white'
                                : 'border-2 border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'font-bold text-[#111e32]' : 'text-slate-800'}`}>
                            {range}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Início</span>
                </button>
              )}

              {step === 1 && (
                <button
                  id="btn-next-step-1"
                  type="button"
                  onClick={handleNextFromStep1}
                  className="ml-auto px-6 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  id="btn-next-step-2"
                  type="button"
                  onClick={handleNextFromStep2}
                  className="px-6 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  id="btn-next-step-3"
                  type="button"
                  onClick={handleNextFromStep3}
                  className="px-6 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 4 && (
                <button
                  id="btn-next-step-4"
                  type="button"
                  onClick={handleNextFromStep4}
                  className="px-6 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 5 && (
                <button
                  id="btn-next-step-5"
                  type="button"
                  onClick={handleNextFromStep5}
                  className="px-6 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 6 && (
                <button
                  id="btn-submit-survey"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TELA 7: TELA DE SUCESSO (EXATAMENTE CONFORME REFERÊNCIA)
        ========================================================= */}
        {step === 7 && (
          <div className="flex-1 h-full max-h-[100dvh] flex flex-col justify-start items-center text-center py-1 sm:py-2 gap-2 animate-in fade-in duration-300">
            {/* Ícone: Grande Círculo Verde com Check no Topo */}
            <div className="pt-1 sm:pt-2 shrink-0">
              <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full bg-[#00a86b] text-white flex items-center justify-center shadow-md mx-auto">
                <Check className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 stroke-[3]" />
              </div>
            </div>

            {/* Título e Mensagens de Agradecimento (compactado) */}
            <div className="space-y-1 px-2 shrink-0">
              <h1 className="text-xl sm:text-2xl font-black text-[#111e32] tracking-tight">
                Sua voz foi registrada!
              </h1>
              <p className="text-xs xs:text-sm font-bold text-slate-700">
                Obrigado por participar do 100 Vozes da Cidade.
              </p>
              <p className="text-[11.5px] xs:text-xs sm:text-sm text-slate-600 leading-snug max-w-xs mx-auto pt-0.5">
                Quanto mais moradores participarem, melhor conseguiremos compreender as prioridades para o futuro de Vitória do Xingu.
              </p>
            </div>

            {/* Bloco de Compartilhamento WhatsApp (mais próximo do texto) */}
            <div className="w-full px-2 space-y-1 shrink-0 my-0.5 max-w-[420px]">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-[#00a86b] hover:bg-[#00925d] active:scale-[0.99] text-white font-bold py-3 xs:py-3.5 px-5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs xs:text-sm min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 xs:w-5 xs:h-5 fill-current" />
                <span>Compartilhar no WhatsApp</span>
              </button>

              <p className="text-[11px] xs:text-xs font-semibold text-slate-700 mt-1">
                Vamos juntos construir novas oportunidades para a nossa cidade!
              </p>
            </div>

            {/* Rodapé Visual: Skyline + Logo 100 Vozes da Cidade + Voltar ao início (compactado e próximo ao botão) */}
            <div className="w-full flex flex-col items-center space-y-0 pt-0.5 pb-2 shrink-0 max-w-[420px]">
              <CitySkyline className="w-full max-w-[200px] xs:max-w-[220px] sm:max-w-[250px] skyline-adaptive h-auto" />

              <div className="mt-4">
                <Logo size="lg" showSubtitle={true} />
              </div>

              <button
                type="button"
                onClick={handleResetSurvey}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline transition-colors mt-2"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
