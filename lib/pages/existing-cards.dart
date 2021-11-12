import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_credit_card/credit_card_brand.dart';
import 'package:flutter_credit_card/credit_card_form.dart';
import 'package:flutter_credit_card/credit_card_model.dart';
import 'package:flutter_credit_card/flutter_credit_card.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class Card {
  String number;
  int expirationMonth;
  int expirationYear;
  String cvc;
  Card(this.number, this.expirationMonth, this.expirationYear, this.cvc) {}
}

class ExistingCardsPage extends StatefulWidget {
  ExistingCardsPage({required Key key}) : super(key: key);

  @override
  ExistingCardsPageState createState() => ExistingCardsPageState();
}

class ExistingCardsPageState extends State<ExistingCardsPage> {
  String cardNumber = '4242424242424242';
  String expiryDate = '04/24';
  String cardHolderName = 'Muhammad Ahsan Ayaz';
  String cvvCode = '042';
  bool useGlassMorphism = false;
  bool useBackgroundImage = false;
  OutlineInputBorder? border;
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  List<Card> cards = [
    Card('4242424242424242', 4, 2024, '042'),
    Card('5555555566554444', 4, 2023, '123'),
  ];

  Future<void> _handlePayPress(Card card) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Success: Please implement me')));
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
      rethrow;
    }
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SingleChildScrollView(
        child:
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          ...cards.map<Widget>((Card card) => GestureDetector(
            onTap: () {
              _handlePayPress(card);
            },
            child: CreditCardWidget(
              glassmorphismConfig:
              useGlassMorphism ? Glassmorphism.defaultConfig() : null,
              cardNumber: card.number.toString(),
              expiryDate: card.expirationMonth.toString() +
                  '/' +
                  card.expirationYear.toString(),
              cardHolderName: '',
              cvvCode: card.cvc.toString(),
              showBackView: false,
              obscureCardNumber: true,
              obscureCardCvv: true,
              isHolderNameVisible: true,
              cardBgColor: Colors.indigo,
              isSwipeGestureEnabled: false,
              onCreditCardWidgetChange:
                  (CreditCardBrand creditCardBrand) {},
            ),
          ))
        ]),
      ),
    );
  }
}
