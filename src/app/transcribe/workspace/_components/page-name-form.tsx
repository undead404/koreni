import { Check } from 'lucide-react';
import { type SubmitEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

import requestApi from '../../api/request';
import { type ProjectImage, projectImageSchema } from '../../schemata';
import { guessNextPageName } from '../_helpers/guess-next-page-name';

import styles from './page-name-form.module.css';

interface PageNameFormProperties {
  projectId: string;
  image: ProjectImage | undefined;
  onImageUpdated: (updatedImage: ProjectImage) => void;
  images?: ProjectImage[];
}

const imageResponseSchema = z.object({
  image: projectImageSchema,
});

export default function PageNameForm({
  projectId,
  image,
  onImageUpdated,
  images = [],
}: PageNameFormProperties) {
  const [pageNameInput, setPageNameInput] = useState('');
  const [isUpdatingPageName, setIsUpdatingPageName] = useState(false);

  useEffect(() => {
    if (image) {
      if (image.pageName) {
        setPageNameInput(image.pageName);
      } else if (images.length > 0) {
        const currentIndex = images.findIndex((img) => img.id === image.id);
        if (currentIndex !== -1) {
          const guess = guessNextPageName(currentIndex, images);
          if (guess) {
            setPageNameInput(guess);
          } else {
            setPageNameInput('');
          }
        }
      } else {
        setPageNameInput('');
      }
    }
  }, [image, images]);

  const handlePageNameSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
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
        const rawData: unknown = await response.json();
        const data = imageResponseSchema.parse(rawData);
        onImageUpdated(data.image);
        toast.success('Назву сторінки оновлено');
      } else {
        throw new Error('Не вдалося оновити назву сторінки');
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
