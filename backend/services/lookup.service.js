const supabase = require('../config/supabase');

exports.listarDistritos = async () => {
  const { data, error } = await supabase
    .from('distritos')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

exports.listarIdiomas = async () => {
  const { data, error } = await supabase
    .from('idiomas')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};