---
title: Portuguese Public Contracts Database
summary: Relational database of 21,748 Portuguese public contracts, with a Flask web app to explore them and answer analytical SQL queries.
#start: "2025-02"                  # TODO: confirm
#end: "2025-06"                    # TODO: confirm
categories: [databases, web]
tech: [Python, SQL, SQLite, Flask, Jinja2, UML, draw.io]
context: school                   # school | personal | hackathon | professional
course: Databases (CC2005)
team: 4 people
# role: What I did in the team    # optional
status: completed                 # completed | in-progress | archived
cover: cover.jpg                # uncomment once cover.png is in this folder
links:
  github: https://github.com/diogo-xyz/Bases_de_Dados_Contratos_Publicos_2024
#  report: https://github.com/diogo-xyz/Bases_de_Dados_Contratos_Publicos_2024/blob/main/Relat%C3%B3rio.pdf
# event:                          # optional: id from timeline.yml or ctfs.yml
featured: false                   # true -> listed first
---

A full database project, from a raw spreadsheet to a working web application,
built on the Portuguese government's open data on **public contracts** from
December 2023 to February 2024.

## Data

- **21,748 contracts**, each with 15 fields: contract type, procedure,
  contracting entity, supplier, price, execution period, location and more.
- Mostly Portuguese contracts, plus international ones involving 17 other
  countries.

## What we built

- **UML class diagram** of the domain, converted into a **relational model**
  with 14 tables (contracts, clients, suppliers, procedures, framework
  agreements, CPV codes, and countries, districts and municipalities).
- **Data cleaning decisions:** for example, filling missing municipalities
  with their district, and using the country name as district and
  municipality for foreign contracts.
- A **Python script** that populates the database from the Excel file,
  reusing existing rows to keep foreign keys consistent.
- **16 analytical SQL queries** answering questions about the data.
- A **Flask web app** to explore everything: lists and detail pages for
  contracts, clients and suppliers, a geographic drill-down
  (country → district → municipality), and one page per SQL query.
