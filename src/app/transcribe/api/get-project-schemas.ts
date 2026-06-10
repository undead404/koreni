const getProjectSchemas = async () => {
  await Promise.resolve();
  return [
    {
      enabled: true,
      label: 'Late russian confession list',
      value: 'confession-list',
    },
    {
      enabled: false,
      label: 'Late russian parish register',
      value: 'parish-register',
    },
  ];
};
export default getProjectSchemas;
