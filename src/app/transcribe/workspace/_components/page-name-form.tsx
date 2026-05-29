import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import requestApi from '../../api/request';
import type { ProjectImage } from '../../schemata';

import styles from '../page.module.css';

interface PageNameFormProperties {
  projectId: string;
  image: ProjectImage | undefined;
  onImageUpdated: (updatedImage: ProjectImage) => void;
}

export default function PageNameForm({
  projectId,
  image,
  onImageUpdated,
}: PageNameFormProperties) {
  const [pageNameInput, setPageNameInput] = useState('');
  const [isUpdatingPageName, setIsUpdatingPageName] = useState(false);

  useEffect(() => {
    if (image) {
      setPageNameInput(image.pageName || '');
    }
  }, [image]);

  const handlePageNameSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!projectId || !image) return;

    if (!/^\d/.test(pageNameInput)) {
      toast.error('Номер сторінки повинен починатися з цифри');
      return;
    }

    setIsUpdatingPageName(true);
    const imageId = image.id;

    try {
      const response = await requestApi(
        `/api/transcribe/projects/${projectId}/images/${imageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageName: pageNameInput }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as { image: ProjectImage };
        onImageUpdated(data.image);
        toast.success('Назву сторінки оновлено');
      }
    } catch {
      toast.error('Не вдалося оновити назву сторінки');
    } finally {
      setIsUpdatingPageName(false);
    }
  };

  return (
    <>
      <form
        className={styles.pageNameForm}
        onSubmit={(event_) => {
          void handlePageNameSubmit(event_);
        }}
      >
        <div className={styles.pageNameField}>
          <label htmlFor="pageName">Назва сторінки (напр. 12, 12зв, 12а)</label>
          <input
            id="pageName"
            type="text"
            className={styles.input}
            value={pageNameInput}
            onChange={(event_) => {
              setPageNameInput(event_.target.value);
            }}
            placeholder="Введіть номер сторінки..."
            required
          />
        </div>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={
            isUpdatingPageName || pageNameInput === (image?.pageName || '')
          }
        >
          <Check size={16} />
          {isUpdatingPageName ? 'Збереження...' : 'Зберегти'}
        </button>
      </form>

      {!image?.pageName && (
        <div className={styles.announcement}>
          <div className={styles.announcementTitle}>
            Потрібна назва сторінки
          </div>
          <div className={styles.announcementText}>
            Будь ласка, вкажіть назву сторінки (наприклад, &quot;12&quot;,
            &quot;12зв&quot;, &quot;12а&quot;, &quot;12азв&quot;), прочитавши її
            із зображення або вивівши її логічно. Транскрибування заблоковано,
            доки не буде введено назву сторінки.
          </div>
        </div>
      )}
    </>
  );
}
