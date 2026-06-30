INSERT INTO Universities (name, email_domain)
VALUES 
('University of Cape Town', 'uct.ac.za'),
('University of Pretoria', 'tuks.co.za'),
('University of the Witwatersrand', 'wits.ac.za'),
('Stellenbosch University', 'sun.ac.za'),
('University of Johannesburg', 'uj.ac.za'),
('Walter Sisulu University', 'mywsu.ac.za')
ON CONFLICT (email_domain) DO NOTHING;

