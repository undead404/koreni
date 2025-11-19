export interface ContactProperties {
  contact: string;
}

export const Contact: React.FC<ContactProperties> = (properties) => {
  return <span>{properties.contact}</span>;
};

export default Contact;
