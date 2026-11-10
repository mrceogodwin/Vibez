update curators set bio = case slug
  when 'neptune' then 'Waterfront nights and loud rooms across Lagos.'
  when 'toke-makinwa' then 'Parties and conversations in Lagos.'
  when 'ay-live' then 'Stand-up nights with a full room.'
  when 'seyi-vibes' then 'Live music with street energy.'
  when 'tiwa-empire' then 'Festivals and all-night parties.'
  else bio
end;
