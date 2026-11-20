import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useServices } from '@/app/services';
import { useAuth } from '@/auth/AuthContext';
import { clearDraft, draftPreview, loadDraft, type GoalDraft } from '@/features/goal/draft';
import { Button, Card } from '@/ui';

export function DraftCard() {
  const { repo } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<GoalDraft | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void loadDraft(repo, user.id).then((d) => !cancelled && setDraft(d));
    return () => {
      cancelled = true;
    };
  }, [repo, user]);

  if (!draft || !user) return null;

  const discard = async () => {
    await clearDraft(repo, user.id);
    setDraft(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 w-full max-w-2xl text-left">
      <Card title="Continue your draft" eyebrow="Saved for you" className="!p-5 sm:!p-6">
        <p className="line-clamp-2 text-ink-soft">“{draftPreview(draft)}”</p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => navigate('/goal/new?resume=1')}>Continue</Button>
          <Button variant="ghost" onClick={discard}>
            Discard
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
