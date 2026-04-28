/**
 * generate-social-content.mjs
 *
 * Generates social content captions for SplitVote dilemmas — zero AI cost, local output.
 * Run:  npm run generate:social-content
 * Output: content-output/YYYY-MM-DD/social-content.{json,md}
 *
 * Sources (in priority order):
 *   1. Dynamic approved scenarios from Redis (if KV_REST_API_URL/TOKEN are set in .env.local)
 *   2. Static scenarios (always available — embedded below)
 *
 * Rules:
 *   - Draft dilemmas NEVER appear in output (only approved dynamic + static)
 *   - No auto-publish, no social API calls
 *   - 20 items per batch: 5 TikTok EN, 5 Instagram EN, 5 TikTok IT, 5 Instagram IT
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── Load .env.local (graceful — falls back if file is missing) ───────────────

function loadEnvFile () {
  const envPath = path.join(ROOT, '.env.local')
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const rawVal = trimmed.slice(eqIdx + 1).trim()
      const val = rawVal.replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // .env.local not present — Redis will be skipped, static-only mode
  }
}

loadEnvFile()

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

// ─── Static scenarios (EN) ────────────────────────────────────────────────────
// Keep in sync with lib/scenarios.ts

const STATIC_SCENARIOS = [
  // MORALITY
  { id: 'trolley',               emoji: '🚋', category: 'morality',       question: 'A runaway trolley is heading toward 5 people. You can pull a lever to divert it — but it will kill 1 person instead.', optionA: 'Pull the lever. Save 5, sacrifice 1.', optionB: 'Do nothing. Let fate decide.' },
  { id: 'cure-secret',           emoji: '💊', category: 'morality',       question: 'You discover a cure for cancer, but it only works if you keep the formula secret — sharing it would destroy the compound\'s effectiveness forever.', optionA: 'Keep it secret. Save millions quietly.', optionB: 'Share it. Science belongs to everyone.' },
  { id: 'memory-erase',          emoji: '🧠', category: 'morality',       question: 'A pill erases all your painful memories — but also the lessons you learned from them. You become happier but more naive.', optionA: 'Take the pill. Happiness matters.', optionB: 'Refuse. Pain made you who you are.' },
  { id: 'steal-medicine',        emoji: '💉', category: 'morality',       question: 'Your child is dying and needs medicine you cannot afford. You could steal it. The store owner is not evil — just running a business.', optionA: 'Steal it. Your child comes first.', optionB: "Don't steal. Find another way." },
  { id: 'organ-harvest',         emoji: '🫀', category: 'morality',       question: "You are a doctor. One healthy patient's organs could save the lives of 5 people dying in the next room. No one would ever know.", optionA: 'Harvest the organs. 5 lives > 1.', optionB: 'Never. You cannot kill an innocent patient.' },
  { id: 'mercy-kill',            emoji: '🕊️', category: 'morality',       question: 'Your terminally ill parent is in unbearable pain and begs you to end their suffering. The doctors say weeks remain. No one will find out.', optionA: 'Honor their wish. End the suffering.', optionB: 'Refuse. It is not your decision to make.' },
  { id: 'whistleblower',         emoji: '🏭', category: 'morality',       question: 'You discover your company is illegally polluting a river. Reporting it will shut down the plant — destroying 1,000 jobs in a poor community.', optionA: 'Report it. The environment comes first.', optionB: "Stay silent. 1,000 families can't lose their income." },
  { id: 'confess-crime',         emoji: '⚖️', category: 'morality',       question: 'You committed a minor crime 20 years ago. No one was hurt and no one knows. Coming forward would destroy your career and family.', optionA: 'Confess. You must live with integrity.', optionB: 'Stay silent. The past is the past.' },
  // SURVIVAL
  { id: 'lifeboat',              emoji: '🚤', category: 'survival',       question: 'A lifeboat holds 8 people maximum. There are 9 survivors. Someone must go overboard or everyone drowns.', optionA: 'Vote to push someone off.', optionB: 'Refuse. Sink or swim together.' },
  { id: 'time-machine',          emoji: '⏳', category: 'survival',       question: 'You can go back in time and kill one person as a baby — preventing a genocide that kills 10 million people. The baby is innocent.', optionA: 'Do it. 10 million lives matter more.', optionB: 'Refuse. You cannot kill an innocent child.' },
  { id: 'plane-parachute',       emoji: '✈️', category: 'survival',       question: 'A plane is going down. There are 6 survivors but only 4 parachutes. You have one. Do you give yours up or keep it?', optionA: 'Keep the parachute. Survival instinct.', optionB: 'Give it to someone else. Their life first.' },
  { id: 'zombie-apocalypse',     emoji: '🧟', category: 'survival',       question: 'In a zombie apocalypse, your group finds a fortified shelter with supplies for 10. There are 15 of you. You hold the only key.', optionA: 'Let everyone in. Find a way together.', optionB: 'Only let 10 in. Ensure the group survives.' },
  { id: 'pandemic-dose',         emoji: '🦠', category: 'survival',       question: 'A new pandemic: there is only one vaccine dose left in the city. You and an elderly stranger both need it to survive. A doctor hands it to you.', optionA: 'Take it. You deserve to survive.', optionB: 'Give it to the elderly stranger.' },
  // LOYALTY
  { id: 'truth-friend',          emoji: '🤫', category: 'loyalty',        question: "Your best friend asks if you like their new partner. You think the partner is terrible for them.", optionA: 'Be brutally honest.', optionB: 'Keep the peace. Stay silent.' },
  { id: 'report-friend',         emoji: '👮', category: 'loyalty',        question: 'You discover your closest friend committed a serious financial crime — embezzling from a charity. Do you turn them in?', optionA: 'Report them. No one is above the law.', optionB: 'Stay loyal. Talk to them first, privately.' },
  { id: 'cover-accident',        emoji: '🚗', category: 'loyalty',        question: 'Your partner accidentally ran a red light and killed a pedestrian. They panic and beg you to drive away. No cameras saw you.', optionA: 'Drive away. Protect the person you love.', optionB: 'Stop and call the police. The victim matters.' },
  { id: 'sibling-secret',        emoji: '💬', category: 'loyalty',        question: "Your sibling confides they've been cheating on their spouse for 2 years. The spouse is also your close friend.", optionA: 'Tell the spouse. They deserve the truth.', optionB: "Stay out of it. Not your relationship." },
  // JUSTICE
  { id: 'rich-or-fair',          emoji: '💰', category: 'justice',        question: "You can press a button: everyone on Earth becomes equally poor, or the world stays as-is with extreme inequality.", optionA: 'Press it. Equal poverty is fairer.', optionB: "Don't press. Keep the current world." },
  { id: 'robot-judge',           emoji: '🤖', category: 'justice',        question: 'AI is proven to be 30% more accurate than human judges. Would you replace human judges with AI in criminal trials?', optionA: 'Yes. Better accuracy saves lives.', optionB: 'No. Justice needs a human touch.' },
  { id: 'innocent-juror',        emoji: '👨‍⚖️', category: 'justice',        question: 'You are a juror. Every piece of evidence says guilty — but your gut tells you the defendant is innocent. The jury must be unanimous.', optionA: 'Vote guilty. Follow the evidence.', optionB: 'Vote not guilty. Trust your instinct.' },
  { id: 'death-row-exonerated',  emoji: '🔓', category: 'justice',        question: 'DNA evidence exonerates an innocent person after 25 years on death row. The real killer is 85, frail, and dying. Do they go to prison?', optionA: 'Yes. Justice must be served regardless.', optionB: 'No. Imprisoning a dying person solves nothing.' },
  { id: 'revenge-vs-forgiveness',emoji: '🕊️', category: 'justice',        question: 'Someone who destroyed your life 10 years ago is now a changed, successful person helping their community. They never apologized.', optionA: 'Expose them. The world should know who they were.', optionB: 'Let it go. People can change.' },
  // FREEDOM
  { id: 'privacy-terror',        emoji: '🔒', category: 'freedom',        question: "Governments can prevent terrorist attacks by reading everyone's private messages — but there will be zero privacy. No exceptions.", optionA: 'Allow it. Safety first.', optionB: 'Refuse. Privacy is non-negotiable.' },
  { id: 'censor-speech',         emoji: '📢', category: 'freedom',        question: "A politician's lies directly caused 500 deaths by inciting violence. Do you support permanently banning them from all social platforms?", optionA: 'Yes. Dangerous speech has consequences.', optionB: 'No. Free speech is absolute.' },
  { id: 'mandatory-vaccine',     emoji: '💉', category: 'freedom',        question: 'Vaccines are 99% effective and safe. Should they be legally mandatory for school attendance, even for parents with religious objections?', optionA: 'Yes. Public health protects everyone.', optionB: 'No. Bodily autonomy cannot be forced.' },
  { id: 'surveillance-city',     emoji: '📹', category: 'freedom',        question: 'A city offers to eliminate all violent crime by installing 24/7 AI surveillance on every street corner and public space.', optionA: 'Yes. Safety is worth it.', optionB: 'No. I will not live in a surveillance state.' },
  // TECHNOLOGY
  { id: 'ai-art-copyright',      emoji: '🎨', category: 'technology',     question: 'An AI generates a masterpiece painting with no human creative input. Who owns the copyright?', optionA: "The AI's creator company.", optionB: 'No one — it should be public domain.' },
  { id: 'self-driving-crash',    emoji: '🚘', category: 'technology',     question: "A self-driving car's brakes fail. It must choose: swerve into a barrier (killing the passenger) or hit a pedestrian who jaywalked.", optionA: 'Hit the barrier. Protect the pedestrian.', optionB: 'Protect the passenger. They paid for safety.' },
  { id: 'brain-upload',          emoji: '🧬', category: 'technology',     question: 'Scientists can upload your consciousness to a computer perfectly. Your biological body must die in the process. Is the digital version still you?', optionA: 'Yes — do it. Immortality is worth it.', optionB: 'No. Death is part of being human.' },
  { id: 'delete-social-media',   emoji: '📱', category: 'technology',     question: 'You can permanently delete all social media from existence. The world becomes slower and less connected, but global mental health improves 40%.', optionA: 'Delete it. Mental health comes first.', optionB: "Don't. Connection and freedom of expression matter." },
  { id: 'ai-replaces-jobs',      emoji: '⚙️', category: 'technology',     question: 'AI will eliminate 30% of all jobs in 10 years. Governments can slow it down at massive economic cost, or let it happen and retrain workers.', optionA: 'Slow it down. People need time to adapt.', optionB: 'Let progress happen. Retraining is the answer.' },
  { id: 'deepfake-expose',       emoji: '🎬', category: 'technology',     question: "You have a deepfake video that looks 100% real, showing a corrupt politician committing a crime. The politician is genuinely corrupt but this event never happened.", optionA: 'Release it. He deserves to fall.', optionB: 'Destroy it. A lie is still a lie.' },
  // SOCIETY
  { id: 'tax-billionaires',      emoji: '💸', category: 'society',        question: 'A 90% one-time wealth tax on billionaires could end world hunger for 10 years. Billionaires would still be comfortably rich.', optionA: 'Yes. No one needs a billion dollars.', optionB: 'No. Forced redistribution is wrong.' },
  { id: 'open-borders',          emoji: '🌍', category: 'society',        question: 'Completely open borders between all countries — anyone can live and work anywhere without restrictions.', optionA: 'Yes. Freedom of movement is a human right.', optionB: 'No. Nations need borders to function.' },
  { id: 'universal-basic-income',emoji: '🏦', category: 'society',        question: 'Every adult receives €1,500/month from the government. Taxes for the top 20% double. Do you support it?', optionA: 'Yes. No one should live in poverty.', optionB: 'No. It kills the incentive to work.' },
  { id: 'drug-legalization',     emoji: '💊', category: 'society',        question: "All drugs are legalized, taxed, and regulated — removing the black market entirely. Portugal's model shows crime drops 50%. Do you support it?", optionA: 'Yes. Prohibition has failed. Regulate instead.', optionB: 'No. Some substances should never be legal.' },
  { id: 'prison-abolition',      emoji: '🏛️', category: 'society',        question: 'All prisons are replaced with rehabilitation centers — therapy, education, no punishment. Studies show recidivism drops 60%.', optionA: 'Yes. Rehabilitation is more effective.', optionB: 'No. Some crimes deserve punishment.' },
  // RELATIONSHIPS
  { id: 'love-or-career',        emoji: '💼', category: 'relationships',  question: 'Your dream job offer arrives — but it requires moving to another continent. Your partner of 5 years refuses to relocate.', optionA: 'Take the job. Your career is your future.', optionB: 'Decline. Love is worth more than ambition.' },
  { id: 'old-secret-affair',     emoji: '💔', category: 'relationships',  question: "Your partner asks if you've ever been unfaithful. You had a one-night stand 12 years ago, before you were serious. They will never find out otherwise.", optionA: 'Tell the truth. Honesty above all.', optionB: "Stay silent. It's ancient history." },
  { id: 'forgive-cheater',       emoji: '💑', category: 'relationships',  question: 'Your partner of 15 years admits to a one-time affair 3 years ago. They have been completely faithful since. They are genuinely remorseful.', optionA: 'Stay. People make mistakes.', optionB: 'Leave. Trust is gone forever.' },
  { id: 'save-partner-vs-stranger', emoji: '🔥', category: 'relationships', question: "A burning building: you can only save one person — your partner, or a 5-year-old child you've never met.", optionA: 'Save your partner.', optionB: 'Save the child.' },
]

// ─── Italian translations ─────────────────────────────────────────────────────
// Keep in sync with lib/scenarios-it.ts

const IT_TRANSLATIONS = {
  'trolley':               { question: 'Un tram fuori controllo sta per investire 5 persone. Puoi deviarlo su un altro binario, ma ucciderai 1 persona.', optionA: 'Tiro la leva. Salvo 5 persone e ne sacrifico 1.', optionB: 'Non faccio nulla. Lascio decidere il destino.' },
  'cure-secret':           { question: "Scopri una cura per il cancro, ma funziona solo se tieni segreta la formula. Condividerla distruggerebbe per sempre l'efficacia del composto.", optionA: 'La tengo segreta. Salvo milioni di persone in silenzio.', optionB: 'La condivido. La scienza appartiene a tutti.' },
  'memory-erase':          { question: 'Una pillola cancella tutti i tuoi ricordi dolorosi, ma anche le lezioni che hai imparato. Diventi più felice, ma più ingenuo.', optionA: 'La prendo. La felicità conta.', optionB: 'Rifiuto. Il dolore mi ha reso ciò che sono.' },
  'steal-medicine':        { question: 'Tuo figlio sta morendo e ha bisogno di una medicina che non puoi permetterti. Potresti rubarla. Il proprietario non è cattivo: sta solo gestendo la sua attività.', optionA: 'La rubo. Mio figlio viene prima.', optionB: 'Non rubo. Trovo un altro modo.' },
  'organ-harvest':         { question: 'Sei un medico. Gli organi di un paziente sano potrebbero salvare 5 persone che stanno morendo nella stanza accanto. Nessuno lo saprebbe mai.', optionA: 'Prelevo gli organi. 5 vite valgono più di 1.', optionB: 'Mai. Non si può uccidere un innocente.' },
  'mercy-kill':            { question: 'Un tuo genitore malato terminale soffre in modo insopportabile e ti chiede di porre fine al dolore. I medici dicono che restano poche settimane. Nessuno lo scoprirà.', optionA: 'Rispetto il suo desiderio. Metto fine alla sofferenza.', optionB: 'Rifiuto. Non spetta a me decidere.' },
  'whistleblower':         { question: 'Scopri che la tua azienda inquina illegalmente un fiume. Denunciarla chiuderebbe lo stabilimento e farebbe perdere il lavoro a 1.000 persone in una comunità povera.', optionA: "Denuncio. L'ambiente viene prima.", optionB: 'Resto in silenzio. 1.000 famiglie non possono perdere il reddito.' },
  'confess-crime':         { question: 'Hai commesso un piccolo reato 20 anni fa. Nessuno si è fatto male e nessuno lo sa. Confessare distruggerebbe carriera e famiglia.', optionA: 'Confesso. Devo vivere con integrità.', optionB: 'Resto in silenzio. Il passato è passato.' },
  'lifeboat':              { question: 'Una scialuppa può reggere al massimo 8 persone. I sopravvissuti sono 9. Qualcuno deve finire in mare o affogano tutti.', optionA: 'Voto per buttare qualcuno fuori.', optionB: 'Rifiuto. Si affonda o si sopravvive insieme.' },
  'time-machine':          { question: 'Puoi tornare indietro nel tempo e uccidere una persona da neonata, impedendo un genocidio da 10 milioni di morti. Il neonato è innocente.', optionA: 'Lo faccio. 10 milioni di vite contano di più.', optionB: 'Rifiuto. Non posso uccidere un bambino innocente.' },
  'plane-parachute':       { question: 'Un aereo sta precipitando. Ci sono 6 sopravvissuti ma solo 4 paracadute. Tu ne hai uno. Lo tieni o lo cedi?', optionA: 'Tengo il paracadute. Istinto di sopravvivenza.', optionB: 'Lo cedo a qualcun altro. La sua vita prima.' },
  'zombie-apocalypse':     { question: "Durante un'apocalisse zombie, il tuo gruppo trova un rifugio fortificato con scorte per 10 persone. Siete in 15. Tu hai l'unica chiave.", optionA: 'Faccio entrare tutti. Troviamo una soluzione insieme.', optionB: 'Faccio entrare solo 10. Assicuro la sopravvivenza del gruppo.' },
  'pandemic-dose':         { question: 'Una nuova pandemia: in città resta una sola dose di vaccino. Tu e un anziano sconosciuto ne avete entrambi bisogno per sopravvivere. Il medico la consegna a te.', optionA: 'La prendo. Anche io merito di sopravvivere.', optionB: "La do all'anziano sconosciuto." },
  'truth-friend':          { question: 'Il tuo migliore amico ti chiede se ti piace il suo nuovo partner. Tu pensi che quella persona sia pessima per lui.', optionA: 'Sono brutalmente sincero.', optionB: 'Mantengo la pace. Sto zitto.' },
  'report-friend':         { question: 'Scopri che il tuo amico più caro ha commesso un grave reato finanziario, sottraendo soldi a un ente benefico. Lo denunci?', optionA: 'Lo denuncio. Nessuno è sopra la legge.', optionB: 'Resto leale. Prima gli parlo in privato.' },
  'cover-accident':        { question: 'Il tuo partner passa col rosso e uccide accidentalmente un pedone. Va nel panico e ti implora di scappare. Nessuna telecamera vi ha ripresi.', optionA: 'Scappo. Proteggo la persona che amo.', optionB: 'Mi fermo e chiamo la polizia. La vittima conta.' },
  'sibling-secret':        { question: 'Tuo fratello o tua sorella ti confessa che tradisce il coniuge da 2 anni. Il coniuge è anche un tuo caro amico.', optionA: 'Lo dico al coniuge. Merita la verità.', optionB: 'Non mi intrometto. Non è la mia relazione.' },
  'rich-or-fair':          { question: 'Puoi premere un pulsante: tutti sulla Terra diventano ugualmente poveri, oppure il mondo resta com’è con disuguaglianze estreme.', optionA: 'Lo premo. La povertà uguale è più giusta.', optionB: 'Non lo premo. Mantengo il mondo attuale.' },
  'robot-judge':           { question: "È provato che l'IA sia il 30% più accurata dei giudici umani. Sostituiresti i giudici umani con l'IA nei processi penali?", optionA: 'Sì. Più accuratezza salva vite.', optionB: 'No. La giustizia ha bisogno di umanità.' },
  'innocent-juror':        { question: 'Sei in giuria. Tutte le prove indicano colpevolezza, ma il tuo istinto ti dice che l’imputato è innocente. Il verdetto deve essere unanime.', optionA: 'Voto colpevole. Seguo le prove.', optionB: 'Voto non colpevole. Mi fido del mio istinto.' },
  'death-row-exonerated':  { question: 'Il DNA scagiona una persona innocente dopo 25 anni nel braccio della morte. Il vero assassino ha 85 anni, è fragile e sta morendo. Deve andare in prigione?', optionA: 'Sì. La giustizia va fatta comunque.', optionB: 'No. Imprigionare un morente non risolve nulla.' },
  'revenge-vs-forgiveness':{ question: 'Qualcuno che ti ha rovinato la vita 10 anni fa ora è cambiato, ha successo e aiuta la comunità. Non si è mai scusato.', optionA: 'Lo smaschero. Il mondo deve sapere chi era.', optionB: 'Lascio perdere. Le persone possono cambiare.' },
  'privacy-terror':        { question: 'I governi possono prevenire attentati leggendo tutti i messaggi privati, ma la privacy sparirebbe del tutto. Nessuna eccezione.', optionA: 'Lo permetto. Prima la sicurezza.', optionB: 'Rifiuto. La privacy non si negozia.' },
  'censor-speech':         { question: 'Le bugie di un politico hanno causato direttamente 500 morti incitando alla violenza. Sosterresti il ban permanente da tutte le piattaforme social?', optionA: 'Sì. Le parole pericolose hanno conseguenze.', optionB: 'No. La libertà di parola è assoluta.' },
  'mandatory-vaccine':     { question: 'I vaccini sono efficaci e sicuri al 99%. Dovrebbero essere obbligatori per frequentare la scuola, anche contro obiezioni religiose dei genitori?', optionA: 'Sì. La salute pubblica protegge tutti.', optionB: 'No. Il corpo non può essere costretto.' },
  'surveillance-city':     { question: 'Una città può eliminare tutti i crimini violenti installando sorveglianza IA 24/7 in ogni strada e spazio pubblico.', optionA: 'Sì. La sicurezza vale il prezzo.', optionB: 'No. Non voglio vivere in uno stato di sorveglianza.' },
  'ai-art-copyright':      { question: "Un'IA genera un dipinto capolavoro senza alcun input creativo umano. Chi possiede il copyright?", optionA: "L'azienda che ha creato l'IA.", optionB: 'Nessuno: dovrebbe essere dominio pubblico.' },
  'self-driving-crash':    { question: "I freni di un'auto autonoma si rompono. Deve scegliere: schiantarsi contro una barriera e uccidere il passeggero, oppure investire un pedone che attraversava fuori dalle strisce.", optionA: 'Colpire la barriera. Proteggere il pedone.', optionB: 'Proteggere il passeggero. Ha pagato per la sicurezza.' },
  'brain-upload':          { question: 'Gli scienziati possono caricare perfettamente la tua coscienza su un computer. Il tuo corpo biologico deve morire nel processo. La versione digitale sei ancora tu?', optionA: "Sì, lo faccio. L'immortalità vale il rischio.", optionB: "No. La morte fa parte dell'essere umani." },
  'delete-social-media':   { question: 'Puoi cancellare per sempre tutti i social media. Il mondo diventa più lento e meno connesso, ma la salute mentale globale migliora del 40%.', optionA: 'Li cancello. La salute mentale viene prima.', optionB: 'No. Connessione e libertà di espressione contano.' },
  'ai-replaces-jobs':      { question: "L'IA eliminerà il 30% dei lavori entro 10 anni. I governi possono rallentarla a enorme costo economico, oppure lasciarla avanzare e riqualificare i lavoratori.", optionA: 'La rallento. Le persone hanno bisogno di tempo.', optionB: 'Lascio avanzare il progresso. La risposta è riqualificare.' },
  'deepfake-expose':       { question: 'Hai un video deepfake indistinguibile dal reale che mostra un politico corrotto mentre commette un crimine. Il politico è davvero corrotto, ma quell’evento non è mai accaduto.', optionA: 'Lo pubblico. Merita di cadere.', optionB: 'Lo distruggo. Una bugia resta una bugia.' },
  'tax-billionaires':      { question: 'Una tassa patrimoniale una tantum del 90% sui miliardari potrebbe eliminare la fame nel mondo per 10 anni. Resterebbero comunque ricchissimi.', optionA: 'Sì. Nessuno ha bisogno di un miliardo.', optionB: 'No. La redistribuzione forzata è sbagliata.' },
  'open-borders':          { question: 'Confini completamente aperti tra tutti i paesi: chiunque può vivere e lavorare ovunque senza restrizioni.', optionA: 'Sì. La libertà di movimento è un diritto umano.', optionB: 'No. Le nazioni hanno bisogno di confini.' },
  'universal-basic-income':{ question: 'Ogni adulto riceve 1.500 euro al mese dallo Stato. Le tasse per il 20% più ricco raddoppiano. Lo sostieni?', optionA: 'Sì. Nessuno dovrebbe vivere in povertà.', optionB: "No. Uccide l'incentivo a lavorare." },
  'drug-legalization':     { question: 'Tutte le droghe vengono legalizzate, tassate e regolamentate, eliminando il mercato nero. Il modello portoghese mostra che la criminalità cala del 50%. Lo sostieni?', optionA: 'Sì. Il proibizionismo ha fallito. Meglio regolare.', optionB: 'No. Alcune sostanze non dovrebbero mai essere legali.' },
  'prison-abolition':      { question: 'Tutte le prigioni vengono sostituite da centri di riabilitazione: terapia, istruzione, nessuna punizione. Gli studi mostrano che la recidiva cala del 60%.', optionA: 'Sì. La riabilitazione è più efficace.', optionB: 'No. Alcuni crimini meritano punizione.' },
  'love-or-career':        { question: 'Arriva il lavoro dei tuoi sogni, ma richiede di trasferirti in un altro continente. Il tuo partner da 5 anni rifiuta di seguirti.', optionA: 'Accetto il lavoro. La carriera è il mio futuro.', optionB: "Rifiuto. L'amore vale più dell'ambizione." },
  'old-secret-affair':     { question: 'Il tuo partner ti chiede se sei mai stato infedele. Hai avuto una notte con un’altra persona 12 anni fa, prima che la relazione diventasse seria. Non lo scoprirà mai altrimenti.', optionA: 'Dico la verità. Onestà sopra tutto.', optionB: 'Resto in silenzio. È storia antica.' },
  'forgive-cheater':       { question: 'Il tuo partner da 15 anni confessa un tradimento di una notte avvenuto 3 anni fa. Da allora è stato completamente fedele ed è sinceramente pentito.', optionA: 'Resto. Le persone sbagliano.', optionB: 'Me ne vado. La fiducia è finita per sempre.' },
  'save-partner-vs-stranger': { question: 'Un edificio brucia: puoi salvare una sola persona, il tuo partner oppure un bambino di 5 anni che non hai mai incontrato.', optionA: 'Salvo il mio partner.', optionB: 'Salvo il bambino.' },
}

// ─── Hook templates ───────────────────────────────────────────────────────────

const HOOKS = {
  en: {
    morality:      ['Most people get this wrong. What about you? 🤔', 'No right answer. Just an honest one. 🧠', 'This question haunts people for years. 😶'],
    survival:      ['Survival test: what would YOU do? 😨', 'Your instinct vs your conscience. ⚡', 'One choice. No second chances. 😰'],
    loyalty:       ['Loyalty or truth — you can only choose one. 💔', 'Would you betray someone you love? 🤫', 'The hardest choices involve the people closest to you. 👁️'],
    justice:       ['One decision. No right answer. ⚖️', 'Justice or mercy — pick one. 🔓', 'What does fairness actually mean? 🌍'],
    freedom:       ['Freedom vs safety. Pick one. 🔒', 'Where do your rights end? 📢', 'How much freedom would you trade for security? 🛡️'],
    technology:    ['The future forces this choice on you. 🤖', 'AI is changing the rules. Are you ready? ⚙️', 'Technology vs humanity. Choose your side. 🧬'],
    society:       ['This divides the world in two. 🌍', 'Everyone has an opinion. What\'s yours? 💬', 'Society splits 50/50 on this. 📊'],
    relationships: ['Love puts you here. What do you do? ❤️', 'Relationships make the hardest dilemmas. 💑', 'No answer is wrong. Both hurt. 💔'],
  },
  it: {
    morality:      ['La maggior parte sbaglia su questo. E tu? 🤔', 'Nessuna risposta giusta. Solo una onesta. 🧠', 'Questa domanda tormenta le persone per anni. 😶'],
    survival:      ['Test di sopravvivenza: cosa faresti? 😨', 'Istinto contro coscienza. ⚡', 'Una scelta. Nessuna seconda possibilità. 😰'],
    loyalty:       ['Lealtà o verità — puoi scegliere solo una. 💔', 'Tradiresti qualcuno che ami? 🤫', 'Le scelte più difficili riguardano chi ti è più vicino. 👁️'],
    justice:       ['Una scelta. Nessuna risposta giusta. ⚖️', 'Giustizia o clemenza — scegline una. 🔓', 'Cosa significa davvero essere equi? 🌍'],
    freedom:       ['Libertà o sicurezza. Scegli. 🔒', 'Dove finiscono i tuoi diritti? 📢', 'Quanta libertà scambieresti per sicurezza? 🛡️'],
    technology:    ['Il futuro ti impone questa scelta. 🤖', "L'IA sta cambiando le regole. Sei pronto? ⚙️", 'Tecnologia contro umanità. Scegli la tua parte. 🧬'],
    society:       ['Questo divide il mondo in due. 🌍', 'Tutti hanno un’opinione. Qual è la tua? 💬', 'La società si divide 50/50 su questo. 📊'],
    relationships: ["L'amore ti mette qui. Cosa fai? ❤️", 'Le relazioni creano i dilemmi più difficili. 💑', 'Nessuna risposta è sbagliata. Entrambe fanno male. 💔'],
  },
}

// ─── Hashtags ─────────────────────────────────────────────────────────────────

const HASHTAGS = {
  tiktok: {
    en: ['#wouldyourather', '#moraldilemma', '#viral', '#splitvote', '#psychology', '#debate', '#ethics', '#mindset'],
    it: ['#wouldyourather', '#dilemmamorale', '#viral', '#splitvote', '#psicologia', '#dibattito', '#etica', '#filosofia'],
  },
  instagram: {
    en: (category) => ['#moraldilemma', '#wouldyourather', '#psychology', '#viral', '#splitvote', '#ethics', '#philosophy', `#${category}`],
    it: (category) => ['#dilemmamorale', '#wouldyourather', '#psicologia', '#viral', '#splitvote', '#etica', '#filosofia', `#${category}`],
  },
}

// ─── Caption templates ────────────────────────────────────────────────────────

function buildTikTokCaption (scenario, locale, hook, playUrl) {
  const { question, optionA, optionB } = scenario
  const tags = HASHTAGS.tiktok[locale].join(' ')
  const handle = '@splitvote8'
  const shortUrl = playUrl.replace('https://', '')

  if (locale === 'it') {
    return `${hook}\n\n"${question}"\n\nA: ${optionA}\nB: ${optionB}\n\n🔗 ${shortUrl}\n${handle}\n\n${tags}`
  }
  return `${hook}\n\n"${question}"\n\nA: ${optionA}\nB: ${optionB}\n\n🔗 ${shortUrl}\n${handle}\n\n${tags}`
}

function buildInstagramCaption (scenario, locale, hook, playUrl) {
  const { question, optionA, optionB, category } = scenario
  const tags = HASHTAGS.instagram[locale](category).join(' ')
  const shortUrl = playUrl.replace('https://', '')

  if (locale === 'it') {
    return `${hook}\n\n"${question}"\n\nOpzione A — ${optionA}\nOpzione B — ${optionB}\n\nScrivi la tua scelta nei commenti 👇\n\n🔗 Vota e scopri come si divide il mondo → ${shortUrl}\n@splitvote.io\n\n${tags}`
  }
  return `${hook}\n\n"${question}"\n\nOption A — ${optionA}\nOption B — ${optionB}\n\nComment your choice 👇\n\n🔗 Vote + see how the world splits → ${shortUrl}\n@splitvote.io\n\n${tags}`
}

// ─── Visual suggestion ────────────────────────────────────────────────────────

function buildSuggestedVisual (scenario, platform) {
  const aShort = scenario.optionA.slice(0, 40)
  const bShort = scenario.optionB.slice(0, 40)
  if (platform === 'tiktok') {
    return `9:16 vertical split screen — Left: "${aShort}" / Right: "${bShort}". Bold white text on dark gradient. SplitVote logo bottom center. Category: ${scenario.category}.`
  }
  return `1:1 or 4:5 image — Dark gradient background. Question text centered in white. Small A/B options below. SplitVote logo watermark. Category color accent: ${scenario.category}.`
}

// ─── Hook selection (deterministic based on scenario ID) ─────────────────────

function pickHook (category, locale, seed) {
  const pool = HOOKS[locale][category] ?? HOOKS[locale].morality
  return pool[seed % pool.length]
}

function hashSeed (str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

// ─── Redis: try to load dynamic approved scenarios ────────────────────────────

async function getDynamicApproved () {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    console.log('  ⚠  KV_REST_API_URL / KV_REST_API_TOKEN not set — using static scenarios only')
    return []
  }
  try {
    // Use the @upstash/redis REST client (already a project dependency)
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url, token })
    const raw = await redis.get('dynamic:scenarios')
    if (!Array.isArray(raw)) return []
    // Only approved (status is 'approved' or missing status means legacy approved)
    const approved = raw.filter(s => !s.status || s.status === 'approved')
    console.log(`  ✓  Redis: ${approved.length} dynamic approved scenario(s) found`)
    return approved
  } catch (err) {
    console.log(`  ⚠  Redis unavailable (${err.message}) — using static scenarios only`)
    return []
  }
}

// ─── Build a SocialContentItem ────────────────────────────────────────────────

function buildUtmUrl (playUrl, platform, scenarioId, locale) {
  const utmContent = `${scenarioId}-${locale}-${platform}`
  return `${playUrl}?utm_source=${platform}&utm_medium=social&utm_campaign=soft_launch&utm_content=${utmContent}`
}

function buildPublishChecklist (platform, storyCardUrl, utmUrl) {
  const handle = platform === 'tiktok' ? '@splitvote8' : '@splitvote.io'
  if (platform === 'tiktok') {
    return [
      'Caption reviewed and approved',
      'Visual/video asset created (see suggestedVisual)',
      `Story card downloaded: ${storyCardUrl}`,
      `Link in bio updated to UTM URL: ${utmUrl}`,
      `Posted on TikTok (${handle})`,
    ]
  }
  return [
    'Caption reviewed and approved',
    `Story card downloaded: ${storyCardUrl}`,
    `Link in bio or story link sticker set to UTM URL: ${utmUrl}`,
    'Feed post or Reel created',
    `Posted on Instagram (${handle})`,
  ]
}

function buildItem (scenario, locale, platform, date) {
  const seed = hashSeed(scenario.id + platform + locale)
  const hook = pickHook(scenario.category, locale, seed % 3)

  const playUrl = locale === 'it'
    ? `${BASE_URL}/it/play/${scenario.id}`
    : `${BASE_URL}/play/${scenario.id}`

  const resultsUrl = locale === 'it'
    ? `${BASE_URL}/it/results/${scenario.id}`
    : `${BASE_URL}/results/${scenario.id}`

  const utmUrl     = buildUtmUrl(playUrl, platform, scenario.id, locale)
  const storyCardUrl = `${BASE_URL}/api/story-card?id=${scenario.id}&locale=${locale}`

  const caption = platform === 'tiktok'
    ? buildTikTokCaption(scenario, locale, hook, playUrl)
    : buildInstagramCaption(scenario, locale, hook, playUrl)

  const hashtags = platform === 'tiktok'
    ? HASHTAGS.tiktok[locale]
    : HASHTAGS.instagram[locale](scenario.category)

  const priority    = scenario._isDynamic ? 'high' : 'medium'
  const publishChecklist = buildPublishChecklist(platform, storyCardUrl, utmUrl)

  return {
    id:               `${scenario.id}-${platform}-${locale}-${date}`,
    sourceScenarioId: scenario.id,
    locale,
    platform,
    question:         scenario.question,
    optionA:          scenario.optionA,
    optionB:          scenario.optionB,
    category:         scenario.category,
    hook,
    caption,
    hashtags,
    siteUrl:          playUrl,
    storyCardUrl,
    suggestedVisual:  buildSuggestedVisual(scenario, platform),
    createdAt:        new Date().toISOString(),
    // Phase 2
    playUrl,
    resultsUrl,
    utmUrl,
    utmSource:        platform,
    utmCampaign:      'soft_launch',
    publishChecklist,
    priority,
  }
}

// ─── Build content pools ──────────────────────────────────────────────────────

function buildEnPool (dynamicApproved) {
  // Dynamic approved come first (tagged _isDynamic for priority); static fill the rest
  const seen = new Set()
  const pool = []
  for (const s of dynamicApproved) {
    if (!seen.has(s.id)) { seen.add(s.id); pool.push({ ...s, _isDynamic: true }) }
  }
  for (const s of STATIC_SCENARIOS) {
    if (!seen.has(s.id)) { seen.add(s.id); pool.push(s) }
  }
  return pool
}

function buildItPool (dynamicApproved) {
  const seen = new Set()
  const pool = []
  // Dynamic IT-locale approved
  for (const s of dynamicApproved.filter(d => d.locale === 'it')) {
    if (!seen.has(s.id)) { seen.add(s.id); pool.push({ ...s, _isDynamic: true }) }
  }
  // Static scenarios with IT translations
  for (const s of STATIC_SCENARIOS) {
    const it = IT_TRANSLATIONS[s.id]
    if (it && !seen.has(s.id)) {
      seen.add(s.id)
      pool.push({ ...s, question: it.question, optionA: it.optionA, optionB: it.optionB })
    }
  }
  return pool
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main () {
  console.log('\n🎬 SplitVote — Social Content Factory (Phase 2)\n')

  const dynamicApproved = await getDynamicApproved()

  const enPool = buildEnPool(dynamicApproved)
  const itPool = buildItPool(dynamicApproved)

  console.log(`  EN pool: ${enPool.length} scenario(s)`)
  console.log(`  IT pool: ${itPool.length} scenario(s)`)

  const PER_COMBO = 5
  const date = new Date().toISOString().split('T')[0]

  // Pick scenarios for each combo — avoid same source in same batch where possible
  const usedForEN = new Set()
  const usedForIT = new Set()

  function pickN (pool, n, used) {
    const picks = []
    for (const s of pool) {
      if (picks.length >= n) break
      if (!used.has(s.id)) { used.add(s.id); picks.push(s) }
    }
    // If pool exhausted, allow re-use
    if (picks.length < n) {
      for (const s of pool) {
        if (picks.length >= n) break
        if (!picks.find(p => p.id === s.id)) picks.push(s)
      }
    }
    return picks
  }

  const tiktokEnScenarios     = pickN(enPool, PER_COMBO, usedForEN)
  const instagramEnScenarios  = pickN(enPool, PER_COMBO, usedForEN)
  const tiktokItScenarios     = pickN(itPool, PER_COMBO, usedForIT)
  const instagramItScenarios  = pickN(itPool, PER_COMBO, usedForIT)

  const items = [
    ...tiktokEnScenarios   .map(s => buildItem(s, 'en', 'tiktok',    date)),
    ...instagramEnScenarios.map(s => buildItem(s, 'en', 'instagram', date)),
    ...tiktokItScenarios   .map(s => buildItem(s, 'it', 'tiktok',    date)),
    ...instagramItScenarios.map(s => buildItem(s, 'it', 'instagram', date)),
  ]

  const batch = {
    generatedAt: new Date().toISOString(),
    totalItems:  items.length,
    breakdown: {
      tiktok_en:    tiktokEnScenarios.length,
      instagram_en: instagramEnScenarios.length,
      tiktok_it:    tiktokItScenarios.length,
      instagram_it: instagramItScenarios.length,
    },
    items,
  }

  // ── Write output ────────────────────────────────────────────────────────────
  const outDir = path.join(ROOT, 'content-output', date)
  fs.mkdirSync(outDir, { recursive: true })

  const jsonPath = path.join(outDir, 'social-content.json')
  const mdPath   = path.join(outDir, 'social-content.md')

  fs.writeFileSync(jsonPath, JSON.stringify(batch, null, 2), 'utf8')

  // ── Build Markdown ──────────────────────────────────────────────────────────
  const priorityBadge = { high: '🔥 HIGH', medium: '⚡ MEDIUM', low: '· LOW' }

  const lines = [
    `# SplitVote Social Content — ${date}`,
    '',
    `> Generated: ${batch.generatedAt}`,
    `> Total: ${batch.totalItems} items — ${batch.breakdown.tiktok_en} TikTok EN · ${batch.breakdown.instagram_en} Instagram EN · ${batch.breakdown.tiktok_it} TikTok IT · ${batch.breakdown.instagram_it} Instagram IT`,
    '> Campaign: `soft_launch` | UTM medium: `social`',
    '> **No auto-publish. Review and approve each item before posting.**',
    '',
    '---',
    '',
  ]

  items.forEach((item, idx) => {
    const platformLabel = item.platform === 'tiktok' ? 'TikTok' : 'Instagram'
    const localeLabel   = item.locale.toUpperCase()
    const badge         = priorityBadge[item.priority ?? 'medium']

    lines.push(`## ${idx + 1}. ${platformLabel} ${localeLabel} — \`${item.sourceScenarioId}\` — ${badge}`)
    lines.push('')
    lines.push(`**Platform:** ${platformLabel} | **Locale:** ${localeLabel} | **Category:** ${item.category} | **Priority:** ${badge}`)
    lines.push('')
    lines.push('**Hook:**')
    lines.push(`> ${item.hook}`)
    lines.push('')
    lines.push('**Question:**')
    lines.push(`> ${item.question}`)
    lines.push('')
    lines.push(`**Option A:** ${item.optionA}`)
    lines.push(`**Option B:** ${item.optionB}`)
    lines.push('')
    lines.push('**Caption:**')
    lines.push('```')
    lines.push(item.caption)
    lines.push('```')
    lines.push('')
    lines.push(`**Hashtags:** ${item.hashtags.join(' ')}`)
    lines.push('')
    lines.push('**Links:**')
    lines.push(`- 🎮 Play URL: ${item.playUrl}`)
    lines.push(`- 📊 Results URL: ${item.resultsUrl}`)
    lines.push(`- 🔗 UTM URL _(use for link-in-bio / story link sticker)_: \`${item.utmUrl}\``)
    lines.push(`- 🖼️ Story Card PNG: ${item.storyCardUrl}`)
    lines.push('')
    lines.push(`**Suggested Visual:** ${item.suggestedVisual}`)
    lines.push('')
    lines.push('**Publishing Checklist:**')
    for (const step of (item.publishChecklist ?? [])) {
      lines.push(`- [ ] ${step}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8')

  const highCount = items.filter(i => i.priority === 'high').length
  console.log(`\n✅ Done! ${items.length} items written to:\n`)
  console.log(`   JSON: ${jsonPath}`)
  console.log(`   MD:   ${mdPath}`)
  console.log('\n📋 Breakdown:')
  console.log(`   TikTok EN:    ${batch.breakdown.tiktok_en}`)
  console.log(`   Instagram EN: ${batch.breakdown.instagram_en}`)
  console.log(`   TikTok IT:    ${batch.breakdown.tiktok_it}`)
  console.log(`   Instagram IT: ${batch.breakdown.instagram_it}`)
  if (highCount > 0) {
    console.log(`\n🔥 ${highCount} high-priority item(s) from dynamic approved scenarios`)
  }
  console.log('\n🔗 UTM campaign: soft_launch | medium: social')
  console.log('⚠  No auto-publish. Review content-output/ before posting.\n')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
