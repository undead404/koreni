export interface ContactProperties {
  contact: string;
}

/**
 * @example <Contact contact="vimelnyk@gmail.com" />
 * @example <Contact contact="vimelnyk@gmail.com, semelnyk@gmail.com" />
 */
export const Contact = ({ contact }: ContactProperties) => {
  if (contact.includes(',')) {
    return (
      <>
        {contact.split(',').map((email, index) => (
          <span key={email}>
            {index > 0 && ', '}
            <a href={`mailto:${email.trim()}`}>{email.trim()}</a>
          </span>
        ))}
      </>
    );
  }

  return <a href={`mailto:${contact}`}>{contact}</a>;
};

export default Contact;
