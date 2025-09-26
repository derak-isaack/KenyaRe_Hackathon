#!/usr/bin/env python3
"""
Check ground truth data structure for marine claims
"""

import pandas as pd
import os

def check_ground_truth():
    try:
        file_path = r'Claims datasets\CASH CALLS PROCESSED SINCE NOVEMBER 2021 .xlsx'
        
        if os.path.exists(file_path):
            df = pd.read_excel(file_path, header=3)
            df.columns = df.columns.str.strip()
            
            print('=== GROUND TRUTH DATA STRUCTURE ===')
            print(f'Total rows: {len(df)}')
            print(f'Columns: {list(df.columns)}')
            print()
            
            # Check marine data
            if 'Main Class of Business' in df.columns:
                marine_data = df[df['Main Class of Business'].str.lower() == 'marine']
                print(f'Marine claims: {len(marine_data)}')
                
            # Check GA Insurance data
            if 'Responsible Partner Name' in df.columns:
                ga_data = df[df['Responsible Partner Name'].str.lower() == 'ga insurance limited']
                print(f'GA Insurance claims: {len(ga_data)}')
                
                # Combined filter
                marine_ga = df[
                    (df['Main Class of Business'].str.lower() == 'marine') &
                    (df['Responsible Partner Name'].str.lower() == 'ga insurance limited')
                ]
                print(f'Marine + GA Insurance claims: {len(marine_ga)}')
                
                if len(marine_ga) > 0:
                    print('\n=== SAMPLE MARINE CLAIMS ===')
                    for i, row in marine_ga.head(2).iterrows():
                        print(f"Claim {i+1}:")
                        for col in ['Responsible Partner Name', 'Amount (Original)', 'Business Title', 'Claim Name', 'Date of Loss']:
                            if col in row:
                                print(f"  {col}: {row[col]}")
                        print()
        else:
            print('Ground truth file not found')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    check_ground_truth()