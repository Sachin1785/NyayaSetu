import pandas as pd
import json

# Load the dataframe, skipping the first row which is a title
df = pd.read_csv('mappings.csv', header=1)

# Clean column names by replacing newlines with spaces
df.columns = df.columns.str.replace('\n', ' ')

# Select relevant columns
# 'IPC Sections' corresponds to the IPC Section Number
# 'BNS Sections/ Subsecti ons' corresponds to the BNS Section Number
# 'Subject' corresponds to the Heading/Description
df_subset = df[['IPC Sections', 'BNS Sections/ Subsecti ons', 'Subject']]

# Rename columns for the JSON output
df_subset.columns = ['IPC_Section', 'BNS_Section', 'Heading']

# Remove rows that are completely empty
df_subset = df_subset.dropna(how='all')

# Convert to a list of dictionaries (JSON structure)
json_data = df_subset.to_dict(orient='records')

# Save to a JSON file
with open('ipc_bns_mappings.json', 'w') as f:
    json.dump(json_data, f, indent=4)

print("JSON file created successfully.")