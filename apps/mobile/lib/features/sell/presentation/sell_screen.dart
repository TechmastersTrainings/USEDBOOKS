import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class SellScreen extends StatefulWidget {
  const SellScreen({Key? key}) : super(key: key);

  @override
  State<SellScreen> createState() => _SellScreenState();
}

class _SellScreenState extends State<SellScreen> {
  final _titleController = TextEditingController();
  final _authorController = TextEditingController();
  final _priceController = TextEditingController(text: '250');
  final _defectController = TextEditingController();

  String _condition = 'very_good';
  bool _missingPages = false;
  bool _annotations = false;
  bool _submitted = false;

  int get _askingPrice => int.tryParse(_priceController.text) ?? 0;
  int get _commission => (_askingPrice * 0.10).round();
  int get _gst => (_commission * 0.18).round();
  int get _netPayout => (_askingPrice - _commission - _gst).clamp(0, 99999);

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _priceController.dispose();
    _defectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return Scaffold(
        appBar: AppBar(title: const Text('Listing Published')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline, color: AppColors.primary, size: 64),
                const SizedBox(height: 16),
                Text(
                  'Book Listed Successfully!',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your book is now visible to readers in Bidar. When an order is placed, a courier will pick it up from your doorstep.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => setState(() {
                    _submitted = false;
                    _titleController.clear();
                    _authorController.clear();
                  }),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('List Another Book'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sell a Book'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primarySubtle,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              children: [
                Icon(Icons.local_shipping_outlined, color: AppColors.primary, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Doorstep pickup from your Bidar address upon sale.',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Title & Author
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Book Title *',
              hintText: 'e.g. Indian Polity for Civil Services',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _authorController,
            decoration: const InputDecoration(
              labelText: 'Author(s) *',
              hintText: 'e.g. M. Laxmikanth',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          // Condition Grade
          const Text('Condition Grade *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildConditionChip('like_new', 'Like New'),
              _buildConditionChip('very_good', 'Very Good'),
              _buildConditionChip('good', 'Good'),
              _buildConditionChip('acceptable', 'Acceptable'),
            ],
          ),
          const SizedBox(height: 16),

          // Defect disclosures
          const Text('Condition Disclosures', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          CheckboxListTile(
            title: const Text('Missing or torn pages?', style: TextStyle(fontSize: 13)),
            value: _missingPages,
            contentPadding: EdgeInsets.zero,
            onChanged: (val) => setState(() => _missingPages = val ?? false),
          ),
          CheckboxListTile(
            title: const Text('Highlighter or pen annotations?', style: TextStyle(fontSize: 13)),
            value: _annotations,
            contentPadding: EdgeInsets.zero,
            onChanged: (val) => setState(() => _annotations = val ?? false),
          ),
          TextField(
            controller: _defectController,
            decoration: const InputDecoration(
              labelText: 'Defect Notes (Optional)',
              hintText: 'e.g. Minor spine creases',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          // Asking Price & Net Payout Calculation
          TextField(
            controller: _priceController,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'Asking Price (INR) *',
              prefixText: '₹ ',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.borderSubtle),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Asking Price:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    Text('₹$_askingPrice', style: const TextStyle(fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Platform Fee (10%):', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    Text('-₹$_commission', style: const TextStyle(fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('GST on Fee (18%):', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    Text('-₹$_gst', style: const TextStyle(fontSize: 12)),
                  ],
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Estimated Net Payout:', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                    Text('₹$_netPayout', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Submit Action
          ElevatedButton(
            onPressed: () {
              if (_titleController.text.trim().isEmpty || _authorController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter book title and author.')),
                );
                return;
              }
              setState(() => _submitted = true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Publish Book Listing', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildConditionChip(String grade, String label) {
    final isSelected = _condition == grade;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primarySubtle,
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 12,
      ),
      onSelected: (_) => setState(() => _condition = grade),
    );
  }
}
