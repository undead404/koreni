export interface ContactProperties {
  contact: string;
}

/**
 * @example <Contact contact="vimelnyk@gmail.com" />
 * @example <Contact contact="vimelnyk@gmail.com, semelnyk@gmail.com" />
 */
export const Contact = ({ contact }: ContactProperties) => {
  const emails = contact
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (emails.length === 0) {
    return null;
  }

  if (emails.length === 1) {
    const [email] = emails;
    return <a href={`mailto:${email}`}>{email}</a>;
  }

  return (
    <>
      {emails.map((email, index) => (
        <span key={email}>
          {index > 0 && ', '}
          <a href={`mailto:${email}`}>{email}</a>
        </span>
      ))}
    </>
  );
};

export default Contact;
