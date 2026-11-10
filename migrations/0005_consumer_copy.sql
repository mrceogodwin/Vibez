-- Shorten sample catalogue copy so screens don't read like internal notes.
update homepage_slots
set title = 'New music',
    subtitle = 'This week on Vibez.'
where id = 'home_hero';

update events set
  blurb = case slug
    when 'wizkid-live-lagos' then 'A December night at Eko Convention Centre.'
    when 'detty-december-festival' then 'Three days of stages by the water.'
    when 'lagos-night-party' then 'A late set on Victoria Island.'
    when 'island-sundown' then 'A waterfront session. Doors are open.'
    when 'ay-live-december' then 'One sitting. A full comedy bill.'
    when 'ph-rooftop' then 'A capped night above Old GRA.'
    when 'lagos-gaming-finals' then 'Finals day. Spectator tickets.'
    when 'abuja-after-hours' then 'An evening in Maitama.'
    when 'benin-year-end' then 'One day, two stages, on the grounds.'
    when 'enugu-countdown' then 'New Year''s Eve by the lake.'
    when 'ibadan-sound' then 'A weeknight at the Cultural Centre.'
    else blurb
  end,
  description = case slug
    when 'wizkid-live-lagos' then 'One night at Eko Convention Centre. Doors, set times and entry are on this page.'
    when 'detty-december-festival' then 'Day tickets and weekend passes are separate. Re-entry rules are on the pass.'
    when 'lagos-night-party' then 'Dress code at the door. Tables are separate from entry.'
    when 'island-sundown' then 'A same-day session on the Island waterfront.'
    when 'ay-live-december' then 'Arrive before the opener. No recording during the set.'
    when 'ph-rooftop' then 'Capacity is fixed. When a tier sells out, it closes.'
    when 'lagos-gaming-finals' then 'Spectator tickets only. Player spots are closed.'
    when 'abuja-after-hours' then 'An evening programme in Maitama. Under 16s are not admitted.'
    when 'benin-year-end' then 'Outdoor programme. Tickets stay valid if the day moves inside the weekend.'
    when 'enugu-countdown' then 'Gate entry by the lake. Wristbands are checked at the door.'
    when 'ibadan-sound' then 'One stage in Mokola. Parking is outside the gate.'
    else description
  end,
  age_note = 'Check the age note with the venue.',
  refund_policy = 'Refunds follow the organiser for this event.'
where is_sample = true;

update artist_profiles set bio = case username
  when 'mudino' then 'Lagos. New music and live nights.'
  when 'ada-rivers' then 'Benin City. Night sets and amapiano.'
  when 'kola-wave' then 'Abuja. Hip-hop and slow records.'
  when 'nia-gold' then 'Port Harcourt. R&B.'
  when 'temi-lane' then 'Ibadan. Songs and shows.'
  else bio
end
where is_sample = true;

update artist_posts set body = 'New music this week.' where id = 'post_mudi_1';
